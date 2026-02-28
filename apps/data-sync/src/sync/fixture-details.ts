import type { Prisma, PrismaClient } from "db";
import type { FixtureDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

const CHUNK_SIZE = 50;

const extractStatValue = (value: unknown, data: unknown): unknown => {
  if (value !== undefined && value !== null) {
    return value;
  }

  if (data === undefined || data === null) {
    return null;
  }

  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value?: unknown }).value ?? null;
  }

  return data;
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (value === undefined || value === null) return undefined;
  return value as Prisma.InputJsonValue;
};

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const dedupeByKey = <T>(items: T[], keyOf: (item: T) => string): T[] => {
  const map = new Map<string, T>();
  for (const item of items) map.set(keyOf(item), item);
  return Array.from(map.values());
};

const syncFixtureDetails = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== FIXTURE DETAILS START ===");
  log.info("🚀 Syncing Fixture Details...");

  const uruguayLeague = await db.league.findFirst({
    where: { country: { code: "UY" } },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Fixture details sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const fixtures = await db.fixture.findMany({
    where: {
      season: { leagueId: uruguayLeague.id },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
      stateId: { not: null },
    },
    select: {
      id: true,
      sportmonksId: true,
      season: { select: { sportmonksId: true } },
    },
    orderBy: [{ seasonId: "desc" }, { sportmonksId: "desc" }],
  });

  if (fixtures.length === 0) {
    log.warn("⚠️  Fixture details sync skipped: no fixtures found. Run sync:fixtures first.");
    return;
  }

  log.info(`📥 Fixtures loaded from database: ${fixtures.length}`);

  const fixtureBySportmonksId = new Map(
    fixtures.map((fixture) => [
      fixture.sportmonksId,
      { id: fixture.id, seasonSportmonksId: fixture.season.sportmonksId },
    ])
  );

  const fixturesBySeason = new Map<number, number[]>();
  for (const fixture of fixtures) {
    const seasonSportmonksId = fixture.season.sportmonksId;
    const seasonFixtures = fixturesBySeason.get(seasonSportmonksId);
    if (!seasonFixtures) {
      fixturesBySeason.set(seasonSportmonksId, [fixture.sportmonksId]);
      continue;
    }
    seasonFixtures.push(fixture.sportmonksId);
  }

  const players = await db.player.findMany({
    select: { id: true, sportmonksId: true },
  });
  const playerIdBySportmonksId = new Map(players.map((player) => [player.sportmonksId, player.id]));
  const teams = await db.team.findMany({
    select: { id: true, sportmonksId: true },
  });
  const teamIdBySportmonksId = new Map(teams.map((team) => [team.sportmonksId, team.id]));

  let savedEvents = 0;
  let savedLineups = 0;
  let savedPlayerStats = 0;
  let savedTeamStats = 0;
  let missingPlayerRefs = 0;
  const missingPlayerSamples: number[] = [];

  const seasons = Array.from(fixturesBySeason.entries());
  for (let seasonIndex = 0; seasonIndex < seasons.length; seasonIndex++) {
    const [seasonSportmonksId, seasonFixtureSportmonksIds] = seasons[seasonIndex];
    log.info(
      `🔎 Processing season ${seasonIndex + 1}/${seasons.length}: ${seasonSportmonksId} (${seasonFixtureSportmonksIds.length} fixtures)`
    );

    const chunks = chunkArray(seasonFixtureSportmonksIds, CHUNK_SIZE);
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkProgress = chunkIndex + 1;

      log.info(
        `📦 Chunk ${chunkProgress}/${chunks.length} (season ${seasonSportmonksId}): ${chunk.length} fixtures`
      );
      log.info(`📡 Fetching fixture details from API...`);
      const apiStart = Date.now();
      const details = await client.get<FixtureDto[]>(`/fixtures/multi/${chunk.join(",")}`, {
        include: "events;events.player;lineups;lineups.player;lineups.details;statistics",
      });
      const apiMs = Date.now() - apiStart;
      log.info(
        `📥 Fixture details fetched: ${details.length} fixtures (season ${seasonSportmonksId}, chunk ${chunkProgress}/${chunks.length}, api=${apiMs}ms)`
      );

      const returnedFixtureIds: number[] = [];

      const eventsBatch: Prisma.EventCreateManyInput[] = [];
      const lineupsBatch: Prisma.LineupCreateManyInput[] = [];
      const playerStatsBatch: Prisma.FixturePlayerStatisticCreateManyInput[] = [];
      const teamStatsBatch: Prisma.FixtureTeamStatisticCreateManyInput[] = [];

      for (const fixtureDto of details) {
        const localFixture = fixtureBySportmonksId.get(fixtureDto.id);
        if (!localFixture) continue;
        const fixtureId = localFixture.id;
        returnedFixtureIds.push(fixtureId);

        const statistics = fixtureDto.statistics ?? [];

        const events = fixtureDto.events ?? [];
        for (const event of events) {
          if (!event.id) continue;
          const eventPlayerSportmonksId = event.player?.id ?? event.player_id ?? null;
          const eventPlayerId =
            eventPlayerSportmonksId != null
              ? (playerIdBySportmonksId.get(eventPlayerSportmonksId) ?? null)
              : null;

          if (eventPlayerSportmonksId != null && !eventPlayerId) {
            missingPlayerRefs += 1;
            if (missingPlayerSamples.length < 20) missingPlayerSamples.push(eventPlayerSportmonksId);
          }

          eventsBatch.push({
            sportmonksId: event.id,
            fixtureId,
            playerId: eventPlayerId,
            typeId: event.type_id ?? null,
            sortOrder: event.sort_order ?? event.order ?? null,
            minute: event.minute ?? null,
            extraMinute: event.extra_minute ?? null,
            result: event.result ?? null,
            info: event.info ?? null,
            addition: event.addition ?? null,
          });
        }

        const lineups = fixtureDto.lineups ?? [];
        for (const lineup of lineups) {
          const lineupPlayerSportmonksId = lineup.player?.id ?? lineup.player_id ?? null;
          if (!lineupPlayerSportmonksId) continue;

          const lineupPlayerId = playerIdBySportmonksId.get(lineupPlayerSportmonksId) ?? null;
          if (!lineupPlayerId) {
            missingPlayerRefs += 1;
            if (missingPlayerSamples.length < 20) missingPlayerSamples.push(lineupPlayerSportmonksId);
            continue;
          }

          lineupsBatch.push({
            fixtureId,
            playerId: lineupPlayerId,
            position:
              typeof lineup.position === "string" ? lineup.position : (lineup.position?.name ?? null),
            formationPosition: lineup.formation_position ?? null,
            jerseyNumber: lineup.jersey_number ?? null,
          });

          const detailRows = lineup.details ?? [];
          for (const detail of detailRows) {
            playerStatsBatch.push({
              sportmonksId: detail.id ?? null,
              fixtureId,
              playerId: lineupPlayerId,
              typeId: detail.type_id ?? null,
              value: toJsonValue(extractStatValue(detail.value, detail.data)),
            });
          }
        }

        for (const statistic of statistics) {
          const statisticPlayerSportmonksId = statistic.player?.id ?? statistic.player_id ?? null;
          if (statisticPlayerSportmonksId != null) {
            const statisticPlayerId = playerIdBySportmonksId.get(statisticPlayerSportmonksId) ?? null;
            if (!statisticPlayerId) {
              missingPlayerRefs += 1;
              if (missingPlayerSamples.length < 20) missingPlayerSamples.push(statisticPlayerSportmonksId);
              continue;
            }

            playerStatsBatch.push({
              sportmonksId: statistic.id ?? null,
              fixtureId,
              playerId: statisticPlayerId,
              typeId: statistic.type_id ?? null,
              value: toJsonValue(extractStatValue(statistic.value, statistic.data)),
            });
            continue;
          }

          teamStatsBatch.push({
            sportmonksId: statistic.id ?? null,
            fixtureId,
            teamId:
              statistic.participant_id != null
                ? (teamIdBySportmonksId.get(statistic.participant_id) ?? null)
                : (statistic.participant?.id != null
                  ? (teamIdBySportmonksId.get(statistic.participant.id) ?? null)
                  : null),
            typeId: statistic.type_id ?? null,
            value: toJsonValue(extractStatValue(statistic.value, statistic.data)),
            location: statistic.location ?? statistic.participant?.meta?.location ?? null,
          });
        }
      }

      const uniqueFixtureIds = Array.from(new Set(returnedFixtureIds));
      const uniqueEvents = dedupeByKey(eventsBatch, (event) => String(event.sportmonksId));
      const uniqueLineups = dedupeByKey(
        lineupsBatch,
        (lineup) => `${lineup.fixtureId}:${lineup.playerId}`
      );

      const playerStatsWithId = dedupeByKey(
        playerStatsBatch.filter(
          (stat): stat is typeof stat & { sportmonksId: number } => stat.sportmonksId != null
        ),
        (stat) => String(stat.sportmonksId)
      );
      const playerStatsWithoutId = playerStatsBatch.filter((stat) => stat.sportmonksId == null);

      const teamStatsWithId = dedupeByKey(
        teamStatsBatch.filter(
          (stat): stat is typeof stat & { sportmonksId: number } => stat.sportmonksId != null
        ),
        (stat) => String(stat.sportmonksId)
      );
      const teamStatsWithoutId = teamStatsBatch.filter((stat) => stat.sportmonksId == null);

      const dbStart = Date.now();
      await db.$transaction(async (tx) => {
        if (uniqueFixtureIds.length > 0) {
          await tx.event.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
          await tx.lineup.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
          await tx.fixturePlayerStatistic.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
          await tx.fixtureTeamStatistic.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
        }

        if (uniqueEvents.length > 0) {
          await tx.event.createMany({ data: uniqueEvents });
        }
        if (uniqueLineups.length > 0) {
          await tx.lineup.createMany({ data: uniqueLineups });
        }
        if (playerStatsWithId.length > 0) {
          await tx.fixturePlayerStatistic.createMany({ data: playerStatsWithId });
        }
        if (playerStatsWithoutId.length > 0) {
          await tx.fixturePlayerStatistic.createMany({ data: playerStatsWithoutId });
        }
        if (teamStatsWithId.length > 0) {
          await tx.fixtureTeamStatistic.createMany({ data: teamStatsWithId });
        }
        if (teamStatsWithoutId.length > 0) {
          await tx.fixtureTeamStatistic.createMany({ data: teamStatsWithoutId });
        }
      }, { maxWait: 20_000, timeout: 120_000 });
      const dbMs = Date.now() - dbStart;

      savedEvents += uniqueEvents.length;
      savedLineups += uniqueLineups.length;
      savedPlayerStats += playerStatsWithId.length + playerStatsWithoutId.length;
      savedTeamStats += teamStatsWithId.length + teamStatsWithoutId.length;

      log.info(
        `💾 Chunk persisted (season ${seasonSportmonksId}, ${chunkProgress}/${chunks.length}): fixtures=${uniqueFixtureIds.length}, events=${uniqueEvents.length}, lineups=${uniqueLineups.length}, playerStats=${playerStatsWithId.length + playerStatsWithoutId.length}, teamStats=${teamStatsWithId.length + teamStatsWithoutId.length}, db=${dbMs}ms`
      );
    }
  }

  const totalEvents = await db.event.count();
  const totalLineups = await db.lineup.count();
  const totalPlayerStats = await db.fixturePlayerStatistic.count();
  const totalTeamStats = await db.fixtureTeamStatistic.count();

  log.info("✅ Fixture details sync summary");
  log.info(
    `🟢 Saved (inserted/updated): events=${savedEvents}, lineups=${savedLineups}, playerStats=${savedPlayerStats}, teamStats=${savedTeamStats}`
  );
  log.info(`🟡 Missing player references: ${missingPlayerRefs}`);
  if (missingPlayerSamples.length > 0) {
    log.warn(`⚠️  Sample missing player IDs: ${missingPlayerSamples.join(", ")}`);
  }
  log.info(
    `📦 Total rows: events=${totalEvents}, lineups=${totalLineups}, playerStats=${totalPlayerStats}, teamStats=${totalTeamStats}`
  );
  log.info("=== FIXTURE DETAILS END ===");
};

export { syncFixtureDetails };

import type { Prisma } from "db";
import type { FixtureDto } from "sportmonks-client";
import type { SyncDependencies, SyncOptions } from "./shared.js";

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

const syncFixtureDetails = async (
  { client, db, log }: SyncDependencies,
  options?: SyncOptions
): Promise<void> => {
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
      season: {
        leagueId: uruguayLeague.id,
        ...(options?.seasonSportmonksIds
          ? { sportmonksId: { in: options.seasonSportmonksIds } }
          : {}),
      },
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
  const playerIdBySportmonksId = new Map(
    players.filter((p) => p.sportmonksId != null).map((p) => [p.sportmonksId as number, p.id])
  );
  const teams = await db.team.findMany({
    select: { id: true, sportmonksId: true },
  });
  const teamIdBySportmonksId = new Map(teams.map((team) => [team.sportmonksId, team.id]));

  const seasons = await db.season.findMany({ select: { id: true, sportmonksId: true } });
  const seasonIdBySportmonksId = new Map(seasons.map((s) => [s.sportmonksId, s.id]));

  const squadMemberships = await db.squadMembership.findMany({
    select: {
      playerId: true,
      shirtNumber: true,
      team: { select: { sportmonksId: true } },
      player: { select: { name: true } },
    },
  });

  const normalizePlayerName = (name: string): string =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const squadByShirt = new Map<string, number[]>();
  const squadByName = new Map<string, number[]>();
  for (const sm of squadMemberships) {
    const teamSmId = sm.team.sportmonksId;
    if (sm.shirtNumber != null) {
      const shirtKey = `${teamSmId}:${sm.shirtNumber}`;
      const existing = squadByShirt.get(shirtKey) ?? [];
      existing.push(sm.playerId);
      squadByShirt.set(shirtKey, existing);
    }
    const nameKey = `${teamSmId}:${normalizePlayerName(sm.player.name)}`;
    const existingName = squadByName.get(nameKey) ?? [];
    existingName.push(sm.playerId);
    squadByName.set(nameKey, existingName);
  }

  const createPlayerWithSquad = async (opts: {
    sportmonksId: number | null;
    name: string;
    firstName: string | null;
    lastName: string | null;
    positionId: number | null;
    dateOfBirth: Date | null;
    countryId: number | null;
    teamSmId: number;
    seasonSmId: number;
    jerseyNumber: number | null;
  }): Promise<number> => {
    const teamId = teamIdBySportmonksId.get(opts.teamSmId) ?? null;
    const seasonId = seasonIdBySportmonksId.get(opts.seasonSmId) ?? null;

    const player = await db.player.create({
      data: {
        sportmonksId: opts.sportmonksId,
        name: opts.name,
        firstName: opts.firstName,
        lastName: opts.lastName,
        positionId: opts.positionId,
        dateOfBirth: opts.dateOfBirth,
        countryId: opts.countryId,
      },
      select: { id: true },
    });

    if (teamId != null && seasonId != null) {
      await db.squadMembership.create({
        data: {
          playerId: player.id,
          teamId,
          seasonId,
          shirtNumber: opts.jerseyNumber,
          from: new Date(),
        },
      });

      if (opts.jerseyNumber != null) {
        const shirtKey = `${opts.teamSmId}:${opts.jerseyNumber}`;
        const existing = squadByShirt.get(shirtKey) ?? [];
        existing.push(player.id);
        squadByShirt.set(shirtKey, existing);
      }
      const nameKey = `${opts.teamSmId}:${normalizePlayerName(opts.name)}`;
      const existingName = squadByName.get(nameKey) ?? [];
      existingName.push(player.id);
      squadByName.set(nameKey, existingName);
    }

    if (opts.sportmonksId != null) {
      playerIdBySportmonksId.set(opts.sportmonksId, player.id);
    }

    return player.id;
  };

  let savedEvents = 0;
  let savedLineups = 0;
  let savedPlayerStats = 0;
  let savedTeamStats = 0;
  let missingPlayerRefs = 0;
  const missingPlayerSamples: number[] = [];

  const seasonEntries = Array.from(fixturesBySeason.entries());
  for (let seasonIndex = 0; seasonIndex < seasonEntries.length; seasonIndex++) {
    const [seasonSportmonksId, seasonFixtureSportmonksIds] = seasonEntries[seasonIndex]!;
    log.info(
      `🔎 Processing season ${seasonIndex + 1}/${seasonEntries.length}: ${seasonSportmonksId} (${seasonFixtureSportmonksIds.length} fixtures)`
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
        include: "events;events.player;lineups;lineups.player;lineups.details;formations;statistics",
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

        const formations = fixtureDto.formations ?? [];
        const homeSmId = fixtureDto.participants?.find((participant) => participant.meta?.location === "home")?.id ?? null;
        const awaySmId = fixtureDto.participants?.find((participant) => participant.meta?.location === "away")?.id ?? null;
        const homeFormationEntry = formations.find(
          (f) => f.participant_id === homeSmId || f.location === "home"
        );
        const awayFormationEntry = formations.find(
          (f) => f.participant_id === awaySmId || f.location === "away"
        );
        const homeFormation = homeFormationEntry?.formation ?? null;
        const awayFormation = awayFormationEntry?.formation ?? null;

        if (homeFormation || awayFormation) {
          await db.fixture.update({
            where: { id: fixtureId },
            data: { homeFormation, awayFormation },
          });
        }

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
            if (missingPlayerSamples.length < 20)
              missingPlayerSamples.push(eventPlayerSportmonksId);
          }

          const relatedPlayerSportmonksId = event.related_player?.id ?? event.related_player_id ?? null;
          const relatedPlayerId =
            relatedPlayerSportmonksId != null
              ? (playerIdBySportmonksId.get(relatedPlayerSportmonksId) ?? null)
              : null;

          eventsBatch.push({
            sportmonksId: event.id,
            fixtureId,
            playerId: eventPlayerId,
            relatedPlayerId,
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
          let lineupPlayerId: number | null = null;

          if (lineupPlayerSportmonksId != null) {
            lineupPlayerId = playerIdBySportmonksId.get(lineupPlayerSportmonksId) ?? null;
            if (!lineupPlayerId) {
              try {
                const smPlayer = await client.get<{
                  id: number;
                  name: string;
                  firstname: string;
                  lastname: string;
                  position_id: number | null;
                  country_id: number | null;
                  date_of_birth: string | null;
                }>(`/players/${lineupPlayerSportmonksId}`);
                lineupPlayerId = await createPlayerWithSquad({
                  sportmonksId: smPlayer.id,
                  name: smPlayer.name,
                  firstName: smPlayer.firstname ?? null,
                  lastName: smPlayer.lastname ?? null,
                  positionId: smPlayer.position_id ?? null,
                  dateOfBirth: smPlayer.date_of_birth ? new Date(smPlayer.date_of_birth) : null,
                  countryId: smPlayer.country_id ?? null,
                  teamSmId: lineup.team_id!,
                  seasonSmId: seasonSportmonksId,
                  jerseyNumber: lineup.jersey_number ?? null,
                });
                log.info(
                  `✅ Player fetched by ID and created: ${smPlayer.name} (SM: ${smPlayer.id})`
                );
              } catch {
                missingPlayerRefs += 1;
                if (missingPlayerSamples.length < 20)
                  missingPlayerSamples.push(lineupPlayerSportmonksId);
                continue;
              }
            }
          } else {
            const teamSmId = lineup.team_id ?? null;
            const jerseyNumber = lineup.jersey_number ?? null;
            const playerName = lineup.player_name ?? null;
            const detailCount = (lineup.details ?? []).length;

            if (teamSmId != null) {
              if (jerseyNumber != null) {
                const shirtKey = `${teamSmId}:${jerseyNumber}`;
                const candidates = squadByShirt.get(shirtKey) ?? [];
                if (candidates.length === 1) {
                  lineupPlayerId = candidates[0]!;
                }
              }

              if (lineupPlayerId == null && playerName != null) {
                const nameKey = `${teamSmId}:${normalizePlayerName(playerName)}`;
                const candidates = squadByName.get(nameKey) ?? [];
                if (candidates.length === 1) {
                  lineupPlayerId = candidates[0]!;
                }
              }
            }

            if (lineupPlayerId == null) {
              if (detailCount === 0) {
                continue;
              }

              let resolvedPlayer: { id: number; sportmonksId: number | null } | null = null;

              if (playerName) {
                try {
                  const searchResults = await client.get<
                    {
                      id: number;
                      name: string;
                      firstname: string;
                      lastname: string;
                      position_id: number | null;
                      country_id: number | null;
                      date_of_birth: string | null;
                    }[]
                  >(
                    `/players/search/${encodeURIComponent(playerName.trim().replace(/\s+/g, " "))}`
                  );

                  if (searchResults.length === 1) {
                    const smPlayer = searchResults[0]!;
                    const existing = playerIdBySportmonksId.get(smPlayer.id);
                    if (existing) {
                      lineupPlayerId = existing;
                    } else {
                      lineupPlayerId = await createPlayerWithSquad({
                        sportmonksId: smPlayer.id,
                        name: smPlayer.name,
                        firstName: smPlayer.firstname ?? null,
                        lastName: smPlayer.lastname ?? null,
                        positionId: smPlayer.position_id ?? null,
                        dateOfBirth: smPlayer.date_of_birth
                          ? new Date(smPlayer.date_of_birth)
                          : null,
                        countryId: smPlayer.country_id ?? null,
                        teamSmId: teamSmId!,
                        seasonSmId: seasonSportmonksId,
                        jerseyNumber,
                      });
                      log.info(
                        `✅ Player resolved via search and created: "${playerName}" → ${smPlayer.name} (SM: ${smPlayer.id})`
                      );
                    }
                  }
                } catch {
                }
              }

              if (lineupPlayerId == null && playerName) {
                const nameParts = playerName.trim().split(" ");
                lineupPlayerId = await createPlayerWithSquad({
                  sportmonksId: null,
                  name: playerName.trim(),
                  firstName: nameParts[0] ?? null,
                  lastName: nameParts.slice(1).join(" ") || null,
                  positionId: null,
                  dateOfBirth: null,
                  countryId: null,
                  teamSmId: teamSmId!,
                  seasonSmId: seasonSportmonksId,
                  jerseyNumber,
                });
                log.warn(
                  `⚠️  Player created from lineup (no SportMonks ID): "${playerName}" jersey=${jerseyNumber} team=${teamSmId} fixture=${fixtureDto.id}`
                );
              }

              if (lineupPlayerId == null) {
                log.error(
                  `❌ Unresolved player in lineup — fixture=${fixtureDto.id} team=${teamSmId} name="${playerName}" jersey=${jerseyNumber} details=${detailCount}`
                );
                continue;
              }
            }
          }

          lineupsBatch.push({
            fixtureId,
            teamId:
              lineup.team_id != null ? (teamIdBySportmonksId.get(lineup.team_id) ?? null) : null,
            playerId: lineupPlayerId,
            position:
              typeof lineup.position === "string"
                ? lineup.position
                : (lineup.position?.name ?? null),
            formationPosition: lineup.formation_position ?? null,
            typeId: lineup.type_id ?? null,
            formationField: lineup.formation_field ?? null,
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
            const statisticPlayerId =
              playerIdBySportmonksId.get(statisticPlayerSportmonksId) ?? null;
            if (!statisticPlayerId) {
              missingPlayerRefs += 1;
              if (missingPlayerSamples.length < 20)
                missingPlayerSamples.push(statisticPlayerSportmonksId);
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
                : statistic.participant?.id != null
                  ? (teamIdBySportmonksId.get(statistic.participant.id) ?? null)
                  : null,
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

      const hasReplacementData =
        uniqueEvents.length > 0 ||
        uniqueLineups.length > 0 ||
        playerStatsWithId.length > 0 ||
        playerStatsWithoutId.length > 0 ||
        teamStatsWithId.length > 0 ||
        teamStatsWithoutId.length > 0;

      const dbStart = Date.now();
      if (!hasReplacementData && uniqueFixtureIds.length > 0) {
        log.warn(
          `⚠️ No detail data returned for chunk ${chunkProgress}/${chunks.length} (season ${seasonSportmonksId}, ${uniqueFixtureIds.length} fixtures). Skipping delete to preserve existing data.`
        );
      } else {
        await db.$transaction(
          async (tx) => {
            if (uniqueFixtureIds.length > 0) {
              await tx.event.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
              await tx.lineup.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
              await tx.fixturePlayerStatistic.deleteMany({
                where: { fixtureId: { in: uniqueFixtureIds } },
              });
              await tx.fixtureTeamStatistic.deleteMany({
                where: { fixtureId: { in: uniqueFixtureIds } },
              });
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
          },
          { maxWait: 20_000, timeout: 120_000 }
        );
      }
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

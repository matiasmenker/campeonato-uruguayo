import type { Prisma, PrismaClient } from "db";
import type { FixtureDto, StandingDto, StandingDetailDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveGoal = (
  value: number | { goals?: number | null } | null | undefined
): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "goals" in value) return value.goals ?? null;
  return null;
};

const extractArray = <T>(raw: { data: T[] } | T[] | undefined): T[] => {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.data ?? [];
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === "object" && value != null) {
    const record = value as Record<string, unknown>;
    if ("value" in record) return toNumber(record.value);
    if ("total" in record) return toNumber(record.total);
  }
  return null;
};

const toInt = (value: unknown): number | null => {
  const parsed = toNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
};

const pickNumberFromDto = (dto: StandingDto, keys: string[]): number | null => {
  const row = dto as unknown as Record<string, unknown>;
  for (const key of keys) {
    const parsed = toInt(row[key]);
    if (parsed != null) return parsed;
  }
  return null;
};

const pickNumberFromDetails = (
  details: StandingDetailDto[] | null | undefined,
  typeIds: readonly number[]
): number | null => {
  if (!details || details.length === 0) return null;
  for (const detail of details) {
    if (detail.type_id == null || !typeIds.includes(detail.type_id)) continue;
    const parsed = toInt(detail.value ?? detail.data ?? null);
    if (parsed != null) return parsed;
  }
  return null;
};

const resolveMetric = (
  dto: StandingDto,
  details: StandingDetailDto[] | null | undefined,
  dtoKeys: string[],
  typeIds: readonly number[]
): number | null => {
  return pickNumberFromDto(dto, dtoKeys) ?? pickNumberFromDetails(details, typeIds);
};

const extractStatValue = (value: unknown, data: unknown): unknown => {
  if (value !== undefined && value !== null) return value;
  if (data === undefined || data === null) return null;
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value?: unknown }).value ?? null;
  }
  return data;
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (value === undefined || value === null) return undefined;
  return value as Prisma.InputJsonValue;
};

const dedupeByKey = <T>(items: T[], keyOf: (item: T) => string): T[] => {
  const map = new Map<string, T>();
  for (const item of items) map.set(keyOf(item), item);
  return Array.from(map.values());
};

const DETAIL_TYPE_IDS = {
  played: [129] as const,
  won: [130] as const,
  draw: [131] as const,
  lost: [132] as const,
  goalsFor: [133] as const,
  goalsAgainst: [134] as const,
};

/**
 * Daily sync — only current season:
 * 1. Fixtures (scores, states, kickoff changes)
 * 2. Fixture details (events, lineups, statistics) for recently played matches
 * 3. Standings
 */
export async function syncDaily({ client, db, log }: SyncDependencies): Promise<void> {
  log.info("=== DAILY SYNC START ===");

  const currentSeason = await db.season.findFirst({
    where: { isCurrent: true },
    select: { id: true, sportmonksId: true, name: true },
  });

  if (!currentSeason) {
    log.warn("⚠️  Daily sync skipped: no current season found.");
    return;
  }

  log.info(`📅 Current season: ${currentSeason.name} (${currentSeason.sportmonksId})`);

  await syncDailyFixtures({ client, db, log }, currentSeason);
  await syncDailyFixtureDetails({ client, db, log }, currentSeason);
  await syncDailyStandings({ client, db, log }, currentSeason);

  log.info("=== DAILY SYNC END ===");
}

// --- FIXTURES ---

async function syncDailyFixtures(
  { client, db, log }: SyncDependencies,
  season: { id: number; sportmonksId: number }
): Promise<void> {
  log.info("--- Daily Fixtures ---");

  const venueMap = new Map(
    (await db.venue.findMany({ select: { sportmonksId: true, id: true } })).map((v) => [v.sportmonksId, v.id])
  );
  const teamMap = new Map(
    (await db.team.findMany({ select: { sportmonksId: true, id: true } })).map((t) => [t.sportmonksId, t.id])
  );
  const stageMap = new Map(
    (await db.stage.findMany({ where: { seasonId: season.id }, select: { sportmonksId: true, id: true } })).map((s) => [s.sportmonksId, s.id])
  );
  const roundMap = new Map(
    (await db.round.findMany({ where: { stage: { seasonId: season.id } }, select: { sportmonksId: true, id: true } })).map((r) => [r.sportmonksId, r.id])
  );
  const groupMap = new Map(
    (await db.group.findMany({ where: { stage: { seasonId: season.id } }, select: { sportmonksId: true, id: true } })).map((g) => [g.sportmonksId, g.id])
  );
  const refereeMap = new Map(
    (await db.referee.findMany({ select: { sportmonksId: true, id: true } })).map((r) => [r.sportmonksId, r.id])
  );

  const seasonResponse = await client.get<{
    fixtures?: { data: FixtureDto[] } | FixtureDto[];
  }>(`/seasons/${season.sportmonksId}`, {
    include: "fixtures;fixtures.participants;fixtures.scores;fixtures.referees",
  });

  const fixtures = extractArray(seasonResponse?.fixtures);
  log.info(`📥 Fixtures fetched: ${fixtures.length}`);

  let saved = 0;

  for (const dto of fixtures) {
    const kickoffAt = toDate(dto.starting_at ?? dto.kickoff_at ?? null);
    const participants = dto.participants ?? [];
    const homeSm = dto.home_team_id ?? participants.find((p) => p.meta?.location === "home")?.id ?? null;
    const awaySm = dto.away_team_id ?? participants.find((p) => p.meta?.location === "away")?.id ?? null;
    const homeTeamId = homeSm != null ? teamMap.get(homeSm) ?? null : null;
    const awayTeamId = awaySm != null ? teamMap.get(awaySm) ?? null : null;

    const scores = dto.scores ?? [];
    const homeScoreRow = scores.find((s) => (s.participant?.id ?? s.participant_id) === homeSm);
    const awayScoreRow = scores.find((s) => (s.participant?.id ?? s.participant_id) === awaySm);

    const refereeSm = dto.referees?.[0]?.id ?? dto.referee_id ?? null;

    const data = {
      sportmonksId: dto.id,
      seasonId: season.id,
      stageId: dto.stage_id != null ? stageMap.get(dto.stage_id) ?? null : null,
      roundId: dto.round_id != null ? roundMap.get(dto.round_id) ?? null : null,
      groupId: dto.group_id != null ? groupMap.get(dto.group_id) ?? null : null,
      venueId: dto.venue_id != null ? venueMap.get(dto.venue_id) ?? null : null,
      refereeId: refereeSm != null ? refereeMap.get(refereeSm) ?? null : null,
      homeTeamId,
      awayTeamId,
      name: dto.name?.trim() || null,
      kickoffAt,
      stateId: dto.state_id ?? null,
      resultInfo: dto.result_info?.trim() || null,
      homeScore: resolveGoal(homeScoreRow?.score) ?? dto.home_score ?? null,
      awayScore: resolveGoal(awayScoreRow?.score) ?? dto.away_score ?? null,
    };

    await db.fixture.upsert({
      where: { sportmonksId: dto.id },
      create: data,
      update: data,
    });
    saved++;
  }

  log.info(`✅ Fixtures saved: ${saved}`);
}

// --- FIXTURE DETAILS ---

async function syncDailyFixtureDetails(
  { client, db, log }: SyncDependencies,
  season: { id: number; sportmonksId: number }
): Promise<void> {
  log.info("--- Daily Fixture Details ---");

  // Find all finished fixtures that have no events synced yet (missing details)
  const finishedFixturesWithoutDetails = await db.fixture.findMany({
    where: {
      seasonId: season.id,
      stateId: 5, // Full Time
      events: { none: {} },
    },
    select: { id: true, sportmonksId: true },
  });

  // Also re-sync fixtures finished in the last 3 days (in case details changed)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentlyFinished = await db.fixture.findMany({
    where: {
      seasonId: season.id,
      kickoffAt: { gte: threeDaysAgo },
      stateId: 5,
    },
    select: { id: true, sportmonksId: true },
  });

  // Merge and dedupe
  const fixtureMap = new Map<number, { id: number; sportmonksId: number }>();
  for (const f of finishedFixturesWithoutDetails) fixtureMap.set(f.sportmonksId, f);
  for (const f of recentlyFinished) fixtureMap.set(f.sportmonksId, f);
  const recentFixtures = Array.from(fixtureMap.values());

  if (recentFixtures.length === 0) {
    log.info("📭 No finished fixtures pending details.");
    return;
  }

  log.info(`📥 Fixtures without details: ${finishedFixturesWithoutDetails.length}`);
  log.info(`📥 Recently finished (last 3 days): ${recentlyFinished.length}`);
  log.info(`📥 Total to sync (deduplicated): ${recentFixtures.length}`);

  const playerMap = new Map(
    (await db.player.findMany({ select: { sportmonksId: true, id: true } })).map((p) => [p.sportmonksId, p.id])
  );
  const teamMap = new Map(
    (await db.team.findMany({ select: { sportmonksId: true, id: true } })).map((t) => [t.sportmonksId, t.id])
  );

  const fixtureIdMap = new Map(recentFixtures.map((f) => [f.sportmonksId, f.id]));

  // Process in chunks of 50 (API limit for /fixtures/multi/)
  const CHUNK_SIZE = 50;
  const allSportmonksIds = recentFixtures.map((f) => f.sportmonksId);
  const chunks: number[][] = [];
  for (let i = 0; i < allSportmonksIds.length; i += CHUNK_SIZE) {
    chunks.push(allSportmonksIds.slice(i, i + CHUNK_SIZE));
  }

  let totalEvents = 0;
  let totalLineups = 0;
  let totalPlayerStats = 0;
  let totalTeamStats = 0;

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    log.info(`📦 Chunk ${chunkIdx + 1}/${chunks.length}: ${chunk.length} fixtures`);

    const details = await client.get<FixtureDto[]>(
      `/fixtures/multi/${chunk.join(",")}`,
      { include: "events;events.player;lineups;lineups.player;lineups.details;statistics" }
    );

    const eventsBatch: Prisma.EventCreateManyInput[] = [];
    const lineupsBatch: Prisma.LineupCreateManyInput[] = [];
    const playerStatsBatch: Prisma.FixturePlayerStatisticCreateManyInput[] = [];
    const teamStatsBatch: Prisma.FixtureTeamStatisticCreateManyInput[] = [];
    const fixtureIds: number[] = [];

    for (const dto of details) {
      const fixtureId = fixtureIdMap.get(dto.id);
      if (!fixtureId) continue;
      fixtureIds.push(fixtureId);

      for (const event of dto.events ?? []) {
        if (!event.id) continue;
        const playerId = event.player?.id ?? event.player_id ?? null;
        eventsBatch.push({
          sportmonksId: event.id,
          fixtureId,
          playerId: playerId != null ? playerMap.get(playerId) ?? null : null,
          typeId: event.type_id ?? null,
          sortOrder: event.sort_order ?? event.order ?? null,
          minute: event.minute ?? null,
          extraMinute: event.extra_minute ?? null,
          result: event.result ?? null,
          info: event.info ?? null,
          addition: event.addition ?? null,
        });
      }

      for (const lineup of dto.lineups ?? []) {
        const lpSmId = lineup.player?.id ?? lineup.player_id ?? null;
        if (!lpSmId) continue;
        const lpId = playerMap.get(lpSmId);
        if (!lpId) continue;

        lineupsBatch.push({
          fixtureId,
          playerId: lpId,
          position: typeof lineup.position === "string" ? lineup.position : (lineup.position?.name ?? null),
          formationPosition: lineup.formation_position ?? null,
          jerseyNumber: lineup.jersey_number ?? null,
        });

        for (const detail of lineup.details ?? []) {
          playerStatsBatch.push({
            sportmonksId: detail.id ?? null,
            fixtureId,
            playerId: lpId,
            typeId: detail.type_id ?? null,
            value: toJsonValue(extractStatValue(detail.value, detail.data)),
          });
        }
      }

      for (const stat of dto.statistics ?? []) {
        const statPlayerSm = stat.player?.id ?? stat.player_id ?? null;
        if (statPlayerSm != null) {
          const statPlayerId = playerMap.get(statPlayerSm);
          if (!statPlayerId) continue;
          playerStatsBatch.push({
            sportmonksId: stat.id ?? null,
            fixtureId,
            playerId: statPlayerId,
            typeId: stat.type_id ?? null,
            value: toJsonValue(extractStatValue(stat.value, stat.data)),
          });
        } else {
          const participantSm = stat.participant_id ?? stat.participant?.id ?? null;
          teamStatsBatch.push({
            sportmonksId: stat.id ?? null,
            fixtureId,
            teamId: participantSm != null ? teamMap.get(participantSm) ?? null : null,
            typeId: stat.type_id ?? null,
            value: toJsonValue(extractStatValue(stat.value, stat.data)),
            location: stat.location ?? stat.participant?.meta?.location ?? null,
          });
        }
      }
    }

    const uniqueFixtureIds = Array.from(new Set(fixtureIds));
    const uniqueEvents = dedupeByKey(eventsBatch, (e) => String(e.sportmonksId));
    const uniqueLineups = dedupeByKey(lineupsBatch, (l) => `${l.fixtureId}:${l.playerId}`);

    await db.$transaction(async (tx) => {
      if (uniqueFixtureIds.length > 0) {
        await tx.event.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
        await tx.lineup.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
        await tx.fixturePlayerStatistic.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
        await tx.fixtureTeamStatistic.deleteMany({ where: { fixtureId: { in: uniqueFixtureIds } } });
      }
      if (uniqueEvents.length > 0) await tx.event.createMany({ data: uniqueEvents });
      if (uniqueLineups.length > 0) await tx.lineup.createMany({ data: uniqueLineups });
      if (playerStatsBatch.length > 0) await tx.fixturePlayerStatistic.createMany({ data: playerStatsBatch });
      if (teamStatsBatch.length > 0) await tx.fixtureTeamStatistic.createMany({ data: teamStatsBatch });
    }, { maxWait: 20_000, timeout: 120_000 });

    totalEvents += uniqueEvents.length;
    totalLineups += uniqueLineups.length;
    totalPlayerStats += playerStatsBatch.length;
    totalTeamStats += teamStatsBatch.length;

    log.info(`💾 Chunk ${chunkIdx + 1} done: events=${uniqueEvents.length}, lineups=${uniqueLineups.length}, playerStats=${playerStatsBatch.length}, teamStats=${teamStatsBatch.length}`);
  }

  log.info(`✅ Details synced: events=${totalEvents}, lineups=${totalLineups}, playerStats=${totalPlayerStats}, teamStats=${totalTeamStats}`);
}

// --- STANDINGS ---

async function syncDailyStandings(
  { client, db, log }: SyncDependencies,
  season: { id: number; sportmonksId: number }
): Promise<void> {
  log.info("--- Daily Standings ---");

  const teamMap = new Map(
    (await db.team.findMany({ select: { sportmonksId: true, id: true } })).map((t) => [t.sportmonksId, t.id])
  );
  const stageMap = new Map(
    (await db.stage.findMany({ where: { seasonId: season.id }, select: { sportmonksId: true, id: true } })).map((s) => [s.sportmonksId, s.id])
  );

  const standingsResponse = await client.get<StandingDto[] | { data: StandingDto[] }>(
    `/standings/seasons/${season.sportmonksId}`,
    { include: "participant;details" }
  );
  const standings = extractArray(standingsResponse as StandingDto[] | { data: StandingDto[] });
  log.info(`📥 Standings fetched: ${standings.length}`);

  const rows: Array<{
    seasonId: number;
    stageId: number | null;
    teamId: number;
    position: number;
    points: number;
    played: number;
    won: number;
    draw: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  }> = [];

  for (const dto of standings) {
    const participantSm = dto.participant_id ?? dto.participant?.id ?? null;
    if (participantSm == null) continue;
    const teamId = teamMap.get(participantSm);
    if (!teamId) continue;

    const stageId = dto.stage_id != null ? stageMap.get(dto.stage_id) ?? null : null;
    const details = dto.details ?? [];

    const position = resolveMetric(dto, details, ["position"], []);
    const points = resolveMetric(dto, details, ["points"], []);
    const played = resolveMetric(dto, details, ["played", "games_played"], DETAIL_TYPE_IDS.played);
    const won = resolveMetric(dto, details, ["won", "wins"], DETAIL_TYPE_IDS.won);
    const draw = resolveMetric(dto, details, ["draw", "drawn"], DETAIL_TYPE_IDS.draw);
    const lost = resolveMetric(dto, details, ["lost", "losses"], DETAIL_TYPE_IDS.lost);
    const goalsFor = resolveMetric(dto, details, ["goals_for", "goals_scored"], DETAIL_TYPE_IDS.goalsFor);
    const goalsAgainst = resolveMetric(dto, details, ["goals_against", "goals_conceded"], DETAIL_TYPE_IDS.goalsAgainst);

    if (position == null || points == null || played == null || won == null || draw == null || lost == null || goalsFor == null || goalsAgainst == null) continue;

    rows.push({ seasonId: season.id, stageId, teamId, position, points, played, won, draw, lost, goalsFor, goalsAgainst });
  }

  await db.$transaction(async (tx) => {
    await tx.standing.deleteMany({ where: { seasonId: season.id } });
    if (rows.length > 0) await tx.standing.createMany({ data: rows });
  });

  log.info(`✅ Standings saved: ${rows.length}`);
}

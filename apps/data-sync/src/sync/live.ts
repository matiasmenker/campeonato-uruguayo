import type { FixtureDto } from "sportmonks-client";
import type { SyncDependencies } from "./shared.js";

const extractArray = <T>(raw: { data: T[] } | T[] | undefined): T[] => {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.data ?? [];
};

const resolveGoal = (
  value: number | { goals?: number | null } | null | undefined
): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "goals" in value) return value.goals ?? null;
  return null;
};

const sameDate = (left: Date | null, right: Date | null): boolean => {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return left.getTime() === right.getTime();
};

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Live sync: lightweight, runs every few minutes on match days.
 *
 * 1. Queries the DB for today's fixtures.
 * 2. If none exist, exits immediately (no API calls).
 * 3. If fixtures exist, fetches fresh data from SportMonks and updates
 *    scores, state, result info, and fixture details (events, lineups, stats).
 */
export async function syncLive(dependencies: SyncDependencies): Promise<void> {
  const { client, db, log } = dependencies;
  log.info("=== LIVE SYNC START ===");
  const startTime = Date.now();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const todayFixtures = await db.fixture.findMany({
    where: {
      kickoffAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: {
      id: true,
      sportmonksId: true,
      stateId: true,
      kickoffAt: true,
      resultInfo: true,
      homeScore: true,
      awayScore: true,
    },
  });

  if (todayFixtures.length === 0) {
    const elapsedMilliseconds = Date.now() - startTime;
    log.info(`No fixtures scheduled for today. Exiting. (${elapsedMilliseconds}ms)`);
    log.info("=== LIVE SYNC END ===");
    return;
  }

  log.info(`📅 Fixtures scheduled today: ${todayFixtures.length}`);

  const fixtureSportmonksIds = todayFixtures.map((fixture) => fixture.sportmonksId);
  const existingFixtureBySportmonksId = new Map(
    todayFixtures.map((fixture) => [fixture.sportmonksId, fixture])
  );

  const fixtureIdBySportmonksId = new Map(
    todayFixtures.map((fixture) => [fixture.sportmonksId, fixture.id])
  );

  const teamRows = await db.team.findMany({ select: { id: true, sportmonksId: true } });
  const teamIdBySportmonksId = new Map(teamRows.map((team) => [team.sportmonksId, team.id]));
  const playerRows = await db.player.findMany({ select: { id: true, sportmonksId: true } });
  const playerIdBySportmonksId = new Map(playerRows.map((player) => [player.sportmonksId, player.id]));

  const apiFixtures = await client.get<FixtureDto[]>(
    `/fixtures/multi/${fixtureSportmonksIds.join(",")}`,
    {
      include: "participants;scores;events;events.player;lineups;lineups.player;lineups.details;statistics",
    }
  );

  const fixturesFromApi = extractArray(apiFixtures as FixtureDto[] | { data: FixtureDto[] });
  log.info(`📥 Fixtures fetched from API: ${fixturesFromApi.length}`);

  let updatedFixtures = 0;
  let createdChangeLogs = 0;
  let savedEvents = 0;
  let savedLineups = 0;
  let savedPlayerStats = 0;
  let savedTeamStats = 0;

  for (const fixtureDto of fixturesFromApi) {
    const fixtureId = fixtureIdBySportmonksId.get(fixtureDto.id);
    if (!fixtureId) continue;

    const existingFixture = existingFixtureBySportmonksId.get(fixtureDto.id);
    const participants = fixtureDto.participants ?? [];
    const homeSportmonksId =
      fixtureDto.home_team_id ??
      participants.find((participant) => participant.meta?.location === "home")?.id ??
      null;
    const awaySportmonksId =
      fixtureDto.away_team_id ??
      participants.find((participant) => participant.meta?.location === "away")?.id ??
      null;

    const scores = fixtureDto.scores ?? [];
    const homeScoreRow = scores.find((score) => {
      const participantId = score.participant?.id ?? score.participant_id ?? null;
      return participantId === homeSportmonksId;
    });
    const awayScoreRow = scores.find((score) => {
      const participantId = score.participant?.id ?? score.participant_id ?? null;
      return participantId === awaySportmonksId;
    });

    const stateId = fixtureDto.state_id ?? null;
    const kickoffAt = toDate(fixtureDto.starting_at ?? fixtureDto.kickoff_at ?? null);
    const resultInfo = fixtureDto.result_info?.trim() || null;
    const homeScore = resolveGoal(homeScoreRow?.score) ?? fixtureDto.home_score ?? null;
    const awayScore = resolveGoal(awayScoreRow?.score) ?? fixtureDto.away_score ?? null;

    await db.fixture.update({
      where: { id: fixtureId },
      data: {
        stateId,
        kickoffAt,
        resultInfo,
        homeScore,
        awayScore,
      },
    });
    updatedFixtures += 1;

    if (existingFixture) {
      const stateChanged = existingFixture.stateId !== stateId;
      const kickoffChanged = !sameDate(existingFixture.kickoffAt, kickoffAt);
      const resultInfoChanged = existingFixture.resultInfo !== resultInfo;

      if (stateChanged || kickoffChanged || resultInfoChanged) {
        await db.fixtureChangeLog.create({
          data: {
            fixtureId,
            previousStateId: existingFixture.stateId,
            nextStateId: stateId,
            previousKickoffAt: existingFixture.kickoffAt,
            nextKickoffAt: kickoffAt,
            previousResultInfo: existingFixture.resultInfo,
            nextResultInfo: resultInfo,
          },
        });
        createdChangeLogs += 1;
      }
    }

    const events = fixtureDto.events ?? [];
    const lineups = fixtureDto.lineups ?? [];
    const statistics = fixtureDto.statistics ?? [];

    const eventRows = events
      .filter((event): event is typeof event & { id: number } => event.id != null)
      .map((event) => {
        const eventPlayerSportmonksId = event.player?.id ?? event.player_id ?? null;
        return {
          sportmonksId: event.id,
          fixtureId,
          playerId:
            eventPlayerSportmonksId != null
              ? (playerIdBySportmonksId.get(eventPlayerSportmonksId) ?? null)
              : null,
          typeId: event.type_id ?? null,
          sortOrder: event.sort_order ?? event.order ?? null,
          minute: event.minute ?? null,
          extraMinute: event.extra_minute ?? null,
          result: event.result ?? null,
          info: event.info ?? null,
          addition: event.addition ?? null,
        };
      });

    const lineupRows = lineups
      .filter((lineup) => {
        const playerSportmonksId = lineup.player?.id ?? lineup.player_id ?? null;
        return playerSportmonksId != null && playerIdBySportmonksId.has(playerSportmonksId);
      })
      .map((lineup) => {
        const playerSportmonksId = (lineup.player?.id ?? lineup.player_id)!;
        return {
          fixtureId,
          playerId: playerIdBySportmonksId.get(playerSportmonksId)!,
          position:
            typeof lineup.position === "string" ? lineup.position : (lineup.position?.name ?? null),
          formationPosition: lineup.formation_position ?? null,
          jerseyNumber: lineup.jersey_number ?? null,
        };
      });

    const playerStatRows: Array<{
      sportmonksId: number | null;
      fixtureId: number;
      playerId: number;
      typeId: number | null;
      value: unknown;
    }> = [];

    const teamStatRows: Array<{
      sportmonksId: number | null;
      fixtureId: number;
      teamId: number | null;
      typeId: number | null;
      value: unknown;
      location: string | null;
    }> = [];

    for (const lineup of lineups) {
      const playerSportmonksId = lineup.player?.id ?? lineup.player_id ?? null;
      if (playerSportmonksId == null) continue;
      const playerId = playerIdBySportmonksId.get(playerSportmonksId);
      if (!playerId) continue;

      const detailRows = lineup.details ?? [];
      for (const detail of detailRows) {
        playerStatRows.push({
          sportmonksId: detail.id ?? null,
          fixtureId,
          playerId,
          typeId: detail.type_id ?? null,
          value: detail.value ?? detail.data ?? null,
        });
      }
    }

    for (const statistic of statistics) {
      const statisticPlayerSportmonksId = statistic.player?.id ?? statistic.player_id ?? null;
      if (statisticPlayerSportmonksId != null) {
        const playerId = playerIdBySportmonksId.get(statisticPlayerSportmonksId);
        if (!playerId) continue;
        playerStatRows.push({
          sportmonksId: statistic.id ?? null,
          fixtureId,
          playerId,
          typeId: statistic.type_id ?? null,
          value: statistic.value ?? statistic.data ?? null,
        });
        continue;
      }

      teamStatRows.push({
        sportmonksId: statistic.id ?? null,
        fixtureId,
        teamId:
          statistic.participant_id != null
            ? (teamIdBySportmonksId.get(statistic.participant_id) ?? null)
            : (statistic.participant?.id != null
              ? (teamIdBySportmonksId.get(statistic.participant.id) ?? null)
              : null),
        typeId: statistic.type_id ?? null,
        value: statistic.value ?? statistic.data ?? null,
        location: statistic.location ?? statistic.participant?.meta?.location ?? null,
      });
    }

    await db.$transaction(async (transaction) => {
      await transaction.event.deleteMany({ where: { fixtureId } });
      await transaction.lineup.deleteMany({ where: { fixtureId } });
      await transaction.fixturePlayerStatistic.deleteMany({ where: { fixtureId } });
      await transaction.fixtureTeamStatistic.deleteMany({ where: { fixtureId } });

      if (eventRows.length > 0) {
        await transaction.event.createMany({ data: eventRows });
      }
      if (lineupRows.length > 0) {
        await transaction.lineup.createMany({ data: lineupRows });
      }
      if (playerStatRows.length > 0) {
        await transaction.fixturePlayerStatistic.createMany({ data: playerStatRows as never });
      }
      if (teamStatRows.length > 0) {
        await transaction.fixtureTeamStatistic.createMany({ data: teamStatRows as never });
      }
    });

    savedEvents += eventRows.length;
    savedLineups += lineupRows.length;
    savedPlayerStats += playerStatRows.length;
    savedTeamStats += teamStatRows.length;
  }

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  log.info("✅ Live sync summary");
  log.info(`🟢 Fixtures updated: ${updatedFixtures}`);
  log.info(`📝 Change logs created: ${createdChangeLogs}`);
  log.info(
    `🟢 Details: events=${savedEvents}, lineups=${savedLineups}, playerStats=${savedPlayerStats}, teamStats=${savedTeamStats}`
  );
  log.info(`=== LIVE SYNC END (${elapsedSeconds}s) ===`);
}

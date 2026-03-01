import type { PrismaClient } from "db";
import type { FixtureDto } from "sportmonks-client";
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

const sameDate = (left: Date | null, right: Date | null): boolean => {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return left.getTime() === right.getTime();
};

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

const DELAYED_STATE_KEYWORDS = ["postponed", "suspended"];

const syncFixtures = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== FIXTURES START ===");
  log.info("🚀 Syncing Fixtures...");

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Fixture sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: { leagueId: uruguayLeague.id },
    select: { id: true, sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Fixture sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  const allVenues = await db.venue.findMany({ select: { sportmonksId: true, id: true } });
  const venueIdBySportmonksId = new Map(allVenues.map((venue) => [venue.sportmonksId, venue.id]));
  const allTeams = await db.team.findMany({ select: { sportmonksId: true, id: true } });
  const teamIdBySportmonksId = new Map(allTeams.map((team) => [team.sportmonksId, team.id]));
  const delayedStates = await db.fixtureState.findMany({
    where: {
      OR: DELAYED_STATE_KEYWORDS.flatMap((keyword) => [
        { state: { contains: keyword, mode: "insensitive" } },
        { name: { contains: keyword, mode: "insensitive" } },
        { shortName: { contains: keyword, mode: "insensitive" } },
        { developerName: { contains: keyword, mode: "insensitive" } },
      ]),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { id: "asc" },
  });
  const delayedStateIds = delayedStates.map((state) => state.id);
  if (delayedStates.length === 0) {
    log.warn("⚠️  No postponed/suspended states found in FixtureState. Run sync:states and review state naming.");
  } else {
    const delayedStateSummary = delayedStates.map((state) => `${state.id}:${state.name}`).join(", ");
    log.info(`📌 Delayed state IDs (postponed/suspended): ${delayedStateSummary}`);
  }

  let savedFixtures = 0;
  let fixturesWithMissingKickoff = 0;
  let fixturesWithMissingTeams = 0;
  let incompleteFixtures = 0;
  let stateChanges = 0;
  let kickoffChanges = 0;
  let resultInfoChanges = 0;
  let createdChangeLogs = 0;
  let delayedFixturesFetched = 0;
  const missingTeamFixtureIds: number[] = [];
  const missingKickoffFixtureIds: number[] = [];
  const incompleteFixtureIds: number[] = [];
  const changedFixtureSamples: number[] = [];

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const seasonResponse = await client.get<{
      fixtures?: { data: FixtureDto[] } | FixtureDto[];
    }>(`/seasons/${season.sportmonksId}`, {
      include: "fixtures;fixtures.participants;fixtures.scores;fixtures.referees",
    });

    const fixtures = extractArray(seasonResponse?.fixtures);
    log.info(`📥 Fixtures fetched from API (${season.sportmonksId}): ${fixtures.length}`);
    let delayedFixtures: FixtureDto[] = [];
    if (delayedStateIds.length > 0) {
      delayedFixtures = await client.getAllPages<FixtureDto>("/fixtures", {
        perPage: 50,
        include: "participants;scores",
        filters: `fixtureSeasons:${season.sportmonksId};fixtureStates:${delayedStateIds.join(",")}`,
      });
      delayedFixturesFetched += delayedFixtures.length;
      log.info(`📥 Delayed fixtures fetched from API (${season.sportmonksId}): ${delayedFixtures.length}`);
    }

    const fixtureBySportmonksId = new Map<number, FixtureDto>();
    for (let j = 0; j < fixtures.length; j++) {
      const fixtureDto = fixtures[j];
      fixtureBySportmonksId.set(fixtureDto.id, fixtureDto);
    }
    for (let j = 0; j < delayedFixtures.length; j++) {
      const fixtureDto = delayedFixtures[j];
      fixtureBySportmonksId.set(fixtureDto.id, fixtureDto);
    }
    const seasonFixtures = Array.from(fixtureBySportmonksId.values());
    log.info(`📦 Fixtures to persist (${season.sportmonksId}): ${seasonFixtures.length}`);

    const stages = await db.stage.findMany({
      where: { seasonId: season.id },
      select: { sportmonksId: true, id: true },
    });
    const stageIdBySportmonksId = new Map(stages.map((stage) => [stage.sportmonksId, stage.id]));

    const rounds = await db.round.findMany({
      where: { stage: { seasonId: season.id } },
      select: { sportmonksId: true, id: true },
    });
    const roundIdBySportmonksId = new Map(rounds.map((round) => [round.sportmonksId, round.id]));

    const groups = await db.group.findMany({
      where: { stage: { seasonId: season.id } },
      select: { sportmonksId: true, id: true },
    });
    const referees = await db.referee.findMany({
      select: { sportmonksId: true, id: true },
    });
    const refereeIdBySportmonksId = new Map(referees.map((referee) => [referee.sportmonksId, referee.id]));
    const groupIdBySportmonksId = new Map(groups.map((group) => [group.sportmonksId, group.id]));
    const existingFixtures = await db.fixture.findMany({
      where: { seasonId: season.id },
      select: {
        id: true,
        sportmonksId: true,
        stateId: true,
        kickoffAt: true,
        resultInfo: true,
      },
    });
    const existingFixtureBySportmonksId = new Map(
      existingFixtures.map((fixture) => [fixture.sportmonksId, fixture])
    );

    for (let j = 0; j < seasonFixtures.length; j++) {
      const fixtureDto = seasonFixtures[j];
      const existingFixture = existingFixtureBySportmonksId.get(fixtureDto.id) ?? null;
      const kickoffAt = toDate(fixtureDto.starting_at ?? fixtureDto.kickoff_at ?? null);

      if (!kickoffAt) {
        fixturesWithMissingKickoff += 1;
        if (missingKickoffFixtureIds.length < 20) {
          missingKickoffFixtureIds.push(fixtureDto.id);
        }
      }

      const stageId =
        fixtureDto.stage_id != null
          ? stageIdBySportmonksId.get(fixtureDto.stage_id) ?? null
          : null;
      const roundId =
        fixtureDto.round_id != null
          ? roundIdBySportmonksId.get(fixtureDto.round_id) ?? null
          : null;
      const groupId =
        fixtureDto.group_id != null
          ? groupIdBySportmonksId.get(fixtureDto.group_id) ?? null
          : null;
      const venueId =
        fixtureDto.venue_id != null
          ? venueIdBySportmonksId.get(fixtureDto.venue_id) ?? null
          : null;
      const refereeSportmonksId = fixtureDto.referees?.[0]?.id ?? fixtureDto.referee_id ?? null;
      const refereeId =
        refereeSportmonksId != null
          ? refereeIdBySportmonksId.get(refereeSportmonksId) ?? null
          : null;

      const participants = fixtureDto.participants ?? [];
      const homeSportmonksId =
        fixtureDto.home_team_id ??
        participants.find((participant) => participant.meta?.location === "home")?.id ??
        null;
      const awaySportmonksId =
        fixtureDto.away_team_id ??
        participants.find((participant) => participant.meta?.location === "away")?.id ??
        null;

      const homeTeamId =
        homeSportmonksId != null
          ? teamIdBySportmonksId.get(homeSportmonksId) ?? null
          : null;
      const awayTeamId =
        awaySportmonksId != null
          ? teamIdBySportmonksId.get(awaySportmonksId) ?? null
          : null;
      const stateId = fixtureDto.state_id ?? null;
      const isIncomplete = homeTeamId == null || awayTeamId == null || stateId == null;

      if (homeSportmonksId == null || awaySportmonksId == null) {
        fixturesWithMissingTeams += 1;
        if (missingTeamFixtureIds.length < 20) {
          missingTeamFixtureIds.push(fixtureDto.id);
        }
      }
      if (isIncomplete) {
        incompleteFixtures += 1;
        if (incompleteFixtureIds.length < 20) {
          incompleteFixtureIds.push(fixtureDto.id);
        }
      }

      const scores = fixtureDto.scores ?? [];
      const homeScoreRow = scores.find((score) => {
        const participantId = score.participant?.id ?? score.participant_id ?? null;
        return participantId === homeSportmonksId;
      });
      const awayScoreRow = scores.find((score) => {
        const participantId = score.participant?.id ?? score.participant_id ?? null;
        return participantId === awaySportmonksId;
      });
      const resultInfo = fixtureDto.result_info?.trim() || null;

      const persistedFixture = await db.fixture.upsert({
        where: { sportmonksId: fixtureDto.id },
        create: {
          sportmonksId: fixtureDto.id,
          seasonId: season.id,
          stageId,
          roundId,
          groupId,
          venueId,
          refereeId,
          homeTeamId,
          awayTeamId,
          name: fixtureDto.name?.trim() || null,
          kickoffAt,
          stateId,
          resultInfo,
          homeScore: resolveGoal(homeScoreRow?.score) ?? fixtureDto.home_score ?? null,
          awayScore: resolveGoal(awayScoreRow?.score) ?? fixtureDto.away_score ?? null,
        },
        update: {
          seasonId: season.id,
          stageId,
          roundId,
          groupId,
          venueId,
          refereeId,
          homeTeamId,
          awayTeamId,
          name: fixtureDto.name?.trim() || null,
          kickoffAt,
          stateId,
          resultInfo,
          homeScore: resolveGoal(homeScoreRow?.score) ?? fixtureDto.home_score ?? null,
          awayScore: resolveGoal(awayScoreRow?.score) ?? fixtureDto.away_score ?? null,
        },
        select: { id: true },
      });

      if (existingFixture) {
        const stateChanged = existingFixture.stateId !== stateId;
        const kickoffChanged = !sameDate(existingFixture.kickoffAt, kickoffAt);
        const resultInfoChanged = existingFixture.resultInfo !== resultInfo;

        if (stateChanged || kickoffChanged || resultInfoChanged) {
          await db.fixtureChangeLog.create({
            data: {
              fixtureId: persistedFixture.id,
              previousStateId: existingFixture.stateId,
              nextStateId: stateId,
              previousKickoffAt: existingFixture.kickoffAt,
              nextKickoffAt: kickoffAt,
              previousResultInfo: existingFixture.resultInfo,
              nextResultInfo: resultInfo,
            },
          });
          createdChangeLogs += 1;
          if (stateChanged) stateChanges += 1;
          if (kickoffChanged) kickoffChanges += 1;
          if (resultInfoChanged) resultInfoChanges += 1;
          if (changedFixtureSamples.length < 20) {
            changedFixtureSamples.push(fixtureDto.id);
          }
        }
      }
      savedFixtures += 1;

      const fixtureProgress = j + 1;
      if (fixtureProgress % 10 === 0 || fixtureProgress === seasonFixtures.length) {
        log.info(
          `💾 Season progress (${season.sportmonksId}): ${fixtureProgress}/${seasonFixtures.length} fixtures`
        );
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.fixture.count();
  log.info("✅ Fixtures sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedFixtures}`);
  log.info(`🟡 Missing kickoffAt from API: ${fixturesWithMissingKickoff}`);
  if (missingKickoffFixtureIds.length > 0) {
    log.warn(`⚠️  Sample fixtures with missing kickoffAt: ${missingKickoffFixtureIds.join(", ")}`);
  }
  log.info(`🟡 Missing team reference from API: ${fixturesWithMissingTeams}`);
  if (missingTeamFixtureIds.length > 0) {
    log.warn(`⚠️  Sample fixtures with missing team reference: ${missingTeamFixtureIds.join(", ")}`);
  }
  log.info(`🟡 Incomplete fixtures saved (missing teams/state): ${incompleteFixtures}`);
  if (incompleteFixtureIds.length > 0) {
    log.warn(`⚠️  Sample incomplete fixture IDs: ${incompleteFixtureIds.join(", ")}`);
  }
  log.info(`🟣 Delayed fixtures fetched from state filter: ${delayedFixturesFetched}`);
  if (delayedStateIds.length > 0) {
    const delayedRows = await db.fixture.count({ where: { stateId: { in: delayedStateIds } } });
    log.info(`🟣 Current rows in delayed states: ${delayedRows}`);
  }
  log.info(
    `📝 Fixture changes detected: total=${createdChangeLogs}, state=${stateChanges}, kickoff=${kickoffChanges}, resultInfo=${resultInfoChanges}`
  );
  if (changedFixtureSamples.length > 0) {
    log.warn(`⚠️  Sample changed fixture IDs: ${changedFixtureSamples.join(", ")}`);
  }
  log.info(`📦 Total rows in Fixture table: ${totalRows}`);
  log.info("=== FIXTURES END ===");
};

export { syncFixtures };

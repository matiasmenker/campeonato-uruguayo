import type { FixtureDto, SquadEntryDto, TeamDto } from "sportmonks-client";
import type { SyncDependencies } from "./shared.js";
interface HealthCheckResult {
  section: string;
  entity: string;
  database: number;
  api: number | null;
  match: boolean;
}
interface FixtureIssue {
  sportmonksId: number;
  name: string;
  problem: string;
}
const extractArray = <T>(
  raw:
    | {
        data: T[];
      }
    | T[]
    | undefined
): T[] => {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : (raw.data ?? []);
};
const resolveGoals = (
  value:
    | number
    | {
        goals?: number | null;
      }
    | null
    | undefined
): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "goals" in value) return value.goals ?? null;
  return null;
};
/**
 * Health check: thorough comparison of DB vs SportMonks API
 * for the current season.
 *
 * Sections:
 *  - Structure: seasons, stages, rounds
 *  - Squads: teams, players per team
 *  - Fixtures: total, finished, scores, events, lineups
 *  - Standings & coaches
 */
export const syncHealth = async (dependencies: SyncDependencies): Promise<void> => {
  const { client, db, log } = dependencies;
  log.info("=== HEALTH CHECK START ===");
  const startTime = Date.now();
  const currentSeason = await db.season.findFirst({
    where: { isCurrent: true },
    select: { id: true, sportmonksId: true, name: true },
  });
  if (!currentSeason) {
    log.warn("Health check aborted: no current season found.");
    return;
  }
  log.info(`Current season: ${currentSeason.name} (${currentSeason.sportmonksId})`);
  const results: HealthCheckResult[] = [];
  const fixtureIssues: FixtureIssue[] = [];
  // ── Structure ──────────────────────────────────────────────────────
  const apiSeasonDetail = await client.get<{
    stages?:
      | {
          data: Array<{
            id: number;
          }>;
        }
      | Array<{
          id: number;
        }>;
    rounds?:
      | {
          data: Array<{
            id: number;
          }>;
        }
      | Array<{
          id: number;
        }>;
  }>(`/seasons/${currentSeason.sportmonksId}`, {
    include: "stages;rounds",
  });
  const apiStages = extractArray(apiSeasonDetail?.stages);
  const databaseStageCount = await db.stage.count({
    where: { seasonId: currentSeason.id },
  });
  results.push({
    section: "Structure",
    entity: "Stages",
    database: databaseStageCount,
    api: apiStages.length,
    match: databaseStageCount >= apiStages.length,
  });
  const apiRounds = extractArray(apiSeasonDetail?.rounds);
  const databaseRoundCount = await db.round.count({
    where: { stage: { seasonId: currentSeason.id } },
  });
  results.push({
    section: "Structure",
    entity: "Rounds",
    database: databaseRoundCount,
    api: apiRounds.length,
    match: databaseRoundCount >= apiRounds.length,
  });
  // ── Squads ─────────────────────────────────────────────────────────
  const apiTeams = await client.getAllPages<TeamDto>(
    `/teams/seasons/${currentSeason.sportmonksId}`,
    { perPage: 50 }
  );
  const databaseTeamCount = await db.team.count({
    where: {
      squadMemberships: {
        some: { seasonId: currentSeason.id },
      },
    },
  });
  results.push({
    section: "Squads",
    entity: "Teams",
    database: databaseTeamCount,
    api: apiTeams.length,
    match: databaseTeamCount >= apiTeams.length,
  });
  const databaseTeams = await db.team.findMany({
    where: {
      squadMemberships: {
        some: { seasonId: currentSeason.id },
      },
    },
    select: { id: true, sportmonksId: true, name: true },
  });
  let totalApiPlayers = 0;
  let totalDatabasePlayers = 0;
  const teamPlayerMismatches: Array<{
    team: string;
    database: number;
    api: number;
  }> = [];
  for (const team of databaseTeams) {
    const apiSquad = await client.getAllPages<SquadEntryDto>(
      `/squads/seasons/${currentSeason.sportmonksId}/teams/${team.sportmonksId}`,
      { perPage: 50 }
    );
    const databasePlayerCount = await db.squadMembership.count({
      where: { seasonId: currentSeason.id, teamId: team.id },
    });
    totalApiPlayers += apiSquad.length;
    totalDatabasePlayers += databasePlayerCount;
    if (databasePlayerCount < apiSquad.length) {
      teamPlayerMismatches.push({
        team: team.name,
        database: databasePlayerCount,
        api: apiSquad.length,
      });
    }
  }
  results.push({
    section: "Squads",
    entity: "Players in squads",
    database: totalDatabasePlayers,
    api: totalApiPlayers,
    match: totalDatabasePlayers >= totalApiPlayers,
  });
  // ── Fixtures ───────────────────────────────────────────────────────
  const seasonFixturesResponse = await client.get<{
    fixtures?:
      | {
          data: FixtureDto[];
        }
      | FixtureDto[];
  }>(`/seasons/${currentSeason.sportmonksId}`, {
    include: "fixtures;fixtures.participants;fixtures.scores",
  });
  const apiFixtures = extractArray(seasonFixturesResponse?.fixtures);
  const databaseFixtureCount = await db.fixture.count({
    where: { seasonId: currentSeason.id },
  });
  results.push({
    section: "Fixtures",
    entity: "Total fixtures",
    database: databaseFixtureCount,
    api: apiFixtures.length,
    match: databaseFixtureCount >= apiFixtures.length,
  });
  // Finished fixtures — compare state_id=5
  const finishedStateId = 5;
  const apiFinishedFixtures = apiFixtures.filter((fixture) => fixture.state_id === finishedStateId);
  const databaseFinishedFixtures = await db.fixture.findMany({
    where: {
      seasonId: currentSeason.id,
      stateId: finishedStateId,
    },
    select: {
      sportmonksId: true,
      homeScore: true,
      awayScore: true,
    },
  });
  results.push({
    section: "Fixtures",
    entity: "Finished",
    database: databaseFinishedFixtures.length,
    api: apiFinishedFixtures.length,
    match: databaseFinishedFixtures.length >= apiFinishedFixtures.length,
  });
  // Score verification — compare fixture by fixture
  const databaseScoreByFixtureId = new Map(
    databaseFinishedFixtures.map((fixture) => [fixture.sportmonksId, fixture])
  );
  let correctScoreCount = 0;
  for (const apiFixture of apiFinishedFixtures) {
    const databaseFixture = databaseScoreByFixtureId.get(apiFixture.id);
    if (!databaseFixture) {
      const fixtureName = apiFixture.name ?? `ID ${apiFixture.id}`;
      fixtureIssues.push({
        sportmonksId: apiFixture.id,
        name: fixtureName,
        problem: "Finished in API but not updated in DB (stale state)",
      });
      continue;
    }
    const participants = apiFixture.participants ?? [];
    const homeParticipantId =
      apiFixture.home_team_id ??
      participants.find((participant) => participant.meta?.location === "home")?.id ??
      null;
    const awayParticipantId =
      apiFixture.away_team_id ??
      participants.find((participant) => participant.meta?.location === "away")?.id ??
      null;
    const scores = apiFixture.scores ?? [];
    const homeScoreEntry = scores.find((score) => {
      const participantId = score.participant?.id ?? score.participant_id ?? null;
      return participantId === homeParticipantId;
    });
    const awayScoreEntry = scores.find((score) => {
      const participantId = score.participant?.id ?? score.participant_id ?? null;
      return participantId === awayParticipantId;
    });
    const apiHomeScore = resolveGoals(homeScoreEntry?.score) ?? apiFixture.home_score ?? null;
    const apiAwayScore = resolveGoals(awayScoreEntry?.score) ?? apiFixture.away_score ?? null;
    const homeMatches = databaseFixture.homeScore === apiHomeScore;
    const awayMatches = databaseFixture.awayScore === apiAwayScore;
    if (homeMatches && awayMatches) {
      correctScoreCount += 1;
    } else {
      const fixtureName = apiFixture.name ?? `ID ${apiFixture.id}`;
      const databaseScore = `${databaseFixture.homeScore ?? "?"}-${databaseFixture.awayScore ?? "?"}`;
      const apiScore = `${apiHomeScore ?? "?"}-${apiAwayScore ?? "?"}`;
      fixtureIssues.push({
        sportmonksId: apiFixture.id,
        name: fixtureName,
        problem: `Score mismatch: DB=${databaseScore} API=${apiScore}`,
      });
    }
  }
  results.push({
    section: "Fixtures",
    entity: "Scores verified",
    database: correctScoreCount,
    api: apiFinishedFixtures.length,
    match: correctScoreCount === apiFinishedFixtures.length,
  });
  // Events and lineups for finished fixtures in DB
  const finishedFixtureSportmonksIds = databaseFinishedFixtures.map(
    (fixture) => fixture.sportmonksId
  );
  const databaseFinishedFixtureRecords = await db.fixture.findMany({
    where: { sportmonksId: { in: finishedFixtureSportmonksIds } },
    select: { id: true, sportmonksId: true },
  });
  let fixturesWithEvents = 0;
  let fixturesWithLineups = 0;
  const fixturesMissingDetails: number[] = [];
  for (const fixture of databaseFinishedFixtureRecords) {
    const eventCount = await db.event.count({ where: { fixtureId: fixture.id } });
    const lineupCount = await db.lineup.count({ where: { fixtureId: fixture.id } });
    if (eventCount > 0) fixturesWithEvents += 1;
    if (lineupCount > 0) fixturesWithLineups += 1;
    if (eventCount === 0 && lineupCount === 0 && fixturesMissingDetails.length < 10) {
      fixturesMissingDetails.push(fixture.sportmonksId);
    }
  }
  const finishedInDatabaseCount = databaseFinishedFixtureRecords.length;
  results.push({
    section: "Fixtures",
    entity: "Have events",
    database: fixturesWithEvents,
    api: finishedInDatabaseCount,
    match: fixturesWithEvents >= finishedInDatabaseCount * 0.9,
  });
  results.push({
    section: "Fixtures",
    entity: "Have lineups",
    database: fixturesWithLineups,
    api: finishedInDatabaseCount,
    match: fixturesWithLineups >= finishedInDatabaseCount * 0.9,
  });
  // ── Standings & Coaches ────────────────────────────────────────────
  const apiStandings = await client.get<
    | Array<{
        id: number;
      }>
    | {
        data: Array<{
          id: number;
        }>;
      }
  >(`/standings/seasons/${currentSeason.sportmonksId}`);
  const apiStandingCount = extractArray(
    apiStandings as
      | Array<{
          id: number;
        }>
      | {
          data: Array<{
            id: number;
          }>;
        }
  ).length;
  const databaseStandingCount = await db.standing.count({
    where: { seasonId: currentSeason.id },
  });
  results.push({
    section: "Other",
    entity: "Standings",
    database: databaseStandingCount,
    api: apiStandingCount,
    match: databaseStandingCount >= apiStandingCount,
  });
  const databaseCoachCount = await db.coachAssignment.count({
    where: { seasonId: currentSeason.id },
  });
  results.push({
    section: "Other",
    entity: "Coach assignments",
    database: databaseCoachCount,
    api: null,
    match: databaseCoachCount > 0,
  });
  // ── Print results ──────────────────────────────────────────────────
  log.info("");
  log.info("┌─────────────┬──────────────────┬──────────┬──────────┬────────┐");
  log.info("│ Section     │ Entity           │ Database │      API │ Status │");
  log.info("├─────────────┼──────────────────┼──────────┼──────────┼────────┤");
  let allHealthy = true;
  let previousSection = "";
  for (const result of results) {
    const showSection = result.section !== previousSection;
    const section = showSection ? result.section.padEnd(11) : "".padEnd(11);
    previousSection = result.section;
    const entity = result.entity.padEnd(16);
    const database = String(result.database).padStart(8);
    const api = result.api === null ? "     N/A" : String(result.api).padStart(8);
    const status = result.match ? "  OK  " : " MISS ";
    if (!result.match) allHealthy = false;
    const logFunction = result.match ? log.info.bind(log) : log.warn.bind(log);
    logFunction(`│ ${section} │ ${entity} │ ${database} │ ${api} │ ${status} │`);
  }
  log.info("└─────────────┴──────────────────┴──────────┴──────────┴────────┘");
  // ── Detailed issues ────────────────────────────────────────────────
  if (teamPlayerMismatches.length > 0) {
    log.info("");
    log.warn("Teams with missing players:");
    for (const mismatch of teamPlayerMismatches) {
      const missing = mismatch.api - mismatch.database;
      log.warn(
        `  - ${mismatch.team}: ${mismatch.database} in DB, ${mismatch.api} in API (${missing} missing)`
      );
    }
  }
  if (fixtureIssues.length > 0) {
    log.info("");
    log.warn("Fixture issues:");
    for (const issue of fixtureIssues.slice(0, 20)) {
      log.warn(`  - ${issue.name} (${issue.sportmonksId}): ${issue.problem}`);
    }
    if (fixtureIssues.length > 20) {
      log.warn(`  ... and ${fixtureIssues.length - 20} more`);
    }
  }
  if (fixturesMissingDetails.length > 0) {
    log.info("");
    log.warn("Finished fixtures missing events and lineups:");
    log.warn(`  Fixture IDs: ${fixturesMissingDetails.join(", ")}`);
  }
  // ── Summary ────────────────────────────────────────────────────────
  log.info("");
  if (allHealthy) {
    log.info("All checks passed — database is in sync with SportMonks.");
  } else {
    log.warn("Some checks failed — run sync:daily to update missing data.");
  }
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  log.info(`=== HEALTH CHECK END (${elapsedSeconds}s) ===`);
};

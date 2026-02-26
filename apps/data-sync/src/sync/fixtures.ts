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

  let savedFixtures = 0;
  let fixturesWithMissingKickoff = 0;
  let fixturesWithMissingTeams = 0;
  const missingTeamFixtureIds: number[] = [];
  const missingKickoffFixtureIds: number[] = [];

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const seasonResponse = await client.get<{
      fixtures?: { data: FixtureDto[] } | FixtureDto[];
    }>(`/seasons/${season.sportmonksId}`, {
      include: "fixtures;fixtures.participants;fixtures.scores",
    });

    const fixtures = extractArray(seasonResponse?.fixtures);
    log.info(`📥 Fixtures fetched from API (${season.sportmonksId}): ${fixtures.length}`);

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
    const groupIdBySportmonksId = new Map(groups.map((group) => [group.sportmonksId, group.id]));

    for (let j = 0; j < fixtures.length; j++) {
      const fixtureDto = fixtures[j];
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

      if (homeSportmonksId == null || awaySportmonksId == null) {
        fixturesWithMissingTeams += 1;
        if (missingTeamFixtureIds.length < 20) {
          missingTeamFixtureIds.push(fixtureDto.id);
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

      await db.fixture.upsert({
        where: { sportmonksId: fixtureDto.id },
        create: {
          sportmonksId: fixtureDto.id,
          seasonId: season.id,
          stageId,
          roundId,
          groupId,
          venueId,
          refereeId: null,
          homeTeamId,
          awayTeamId,
          name: fixtureDto.name?.trim() || null,
          kickoffAt,
          stateId: fixtureDto.state_id ?? null,
          resultInfo: fixtureDto.result_info?.trim() || null,
          homeScore: resolveGoal(homeScoreRow?.score) ?? fixtureDto.home_score ?? null,
          awayScore: resolveGoal(awayScoreRow?.score) ?? fixtureDto.away_score ?? null,
        },
        update: {
          seasonId: season.id,
          stageId,
          roundId,
          groupId,
          venueId,
          homeTeamId,
          awayTeamId,
          name: fixtureDto.name?.trim() || null,
          kickoffAt,
          stateId: fixtureDto.state_id ?? null,
          resultInfo: fixtureDto.result_info?.trim() || null,
          homeScore: resolveGoal(homeScoreRow?.score) ?? fixtureDto.home_score ?? null,
          awayScore: resolveGoal(awayScoreRow?.score) ?? fixtureDto.away_score ?? null,
        },
      });
      savedFixtures += 1;

      const fixtureProgress = j + 1;
      if (fixtureProgress % 10 === 0 || fixtureProgress === fixtures.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${fixtureProgress}/${fixtures.length} fixtures`);
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
  log.info(`📦 Total rows in Fixture table: ${totalRows}`);
  log.info("=== FIXTURES END ===");
};

export { syncFixtures };

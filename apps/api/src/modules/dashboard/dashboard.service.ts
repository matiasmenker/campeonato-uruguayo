import type { DetailResponse } from "../../contracts/pagination.js";
import { getPrisma } from "../../database/index.js";
import {
  toLeagueSummary,
  toSeasonSummary,
  toStageSummary,
  toRoundSummary,
} from "../competition/competition.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toStandingContract } from "../standings/standings.mapper.js";
import type { DashboardOverviewContract, DashboardFixtureSummary, DashboardVenueSummary } from "./dashboard.contracts.js";
export const getDashboardOverview = async (): Promise<
  DetailResponse<DashboardOverviewContract>
> => {
  const prisma = getPrisma();
  const currentSeason = await prisma.season.findFirst({
    where: { isCurrent: true },
    include: {
      league: true,
      stages: {
        include: {
          rounds: { orderBy: { id: "asc" } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!currentSeason) {
    return {
      data: {
        league: null,
        season: null,
        currentStage: null,
        currentRound: null,
        lastCompletedRound: null,
        totalTeams: 0,
        totalPlayers: 0,
        totalFixtures: 0,
        completedFixtures: 0,
        upcomingFixtures: [],
        recentResults: [],
        standings: [],
      },
    };
  }
  const currentStage = currentSeason.stages.find((stage) => stage.isCurrent) ?? null;

  const [fixtureStates, activeRoundAnchor] = await Promise.all([
    prisma.fixtureState.findMany({ select: { id: true, developerName: true } }),
    // Active round = the round of the most recently kicked-off fixture.
    // This is reliable regardless of the isCurrent sync flag:
    // - Mid-round (some played, some upcoming): shows the in-progress round
    // - Between rounds: shows the last completed round
    // - Pre-season: falls back to the earliest upcoming round
    prisma.fixture.findFirst({
      where: { seasonId: currentSeason.id, kickoffAt: { lte: new Date() } },
      orderBy: { kickoffAt: "desc" },
      select: { roundId: true },
    }),
  ]);

  const stateNameById = new Map(fixtureStates.map((state) => [state.id, state.developerName]));

  // Fall back to the earliest upcoming round when no fixture has kicked off yet
  const activeRoundId = activeRoundAnchor?.roundId ?? (
    await prisma.fixture.findFirst({
      where: { seasonId: currentSeason.id, kickoffAt: { gte: new Date() } },
      orderBy: { kickoffAt: "asc" },
      select: { roundId: true },
    })
  )?.roundId ?? null;

  const allRounds = currentSeason.stages.flatMap((stage) => stage.rounds);
  const activeRound = allRounds.find((round) => round.id === activeRoundId) ?? null;

  const [
    totalTeams,
    totalPlayers,
    totalFixtures,
    completedFixtures,
    activeRoundFixturesRaw,
    standingsRaw,
    lastCompletedRoundAnchor,
  ] = await Promise.all([
    prisma.squadMembership
      .findMany({
        where: { seasonId: currentSeason.id },
        select: { teamId: true },
        distinct: ["teamId"],
      })
      .then((rows) => rows.length),
    prisma.squadMembership
      .findMany({
        where: { seasonId: currentSeason.id },
        select: { playerId: true },
        distinct: ["playerId"],
      })
      .then((rows) => rows.length),
    prisma.fixture.count({ where: { seasonId: currentSeason.id } }),
    prisma.fixture.count({
      where: {
        seasonId: currentSeason.id,
        homeScore: { not: null },
        awayScore: { not: null },
      },
    }),
    prisma.fixture.findMany({
      where: {
        seasonId: currentSeason.id,
        ...(activeRoundId ? { roundId: activeRoundId } : {}),
      },
      include: { homeTeam: true, awayTeam: true, venue: true },
      orderBy: { kickoffAt: "asc" },
    }),
    prisma.standing.findMany({
      where: {
        seasonId: currentSeason.id,
        ...(currentStage ? { stageId: currentStage.id } : {}),
      },
      include: { season: true, stage: true, team: true },
      orderBy: { position: "asc" },
    }),
    // Last round where every fixture has a score (fully completed)
    prisma.fixture.findFirst({
      where: {
        seasonId: currentSeason.id,
        homeScore: { not: null },
        awayScore: { not: null },
        round: {
          fixtures: {
            every: { homeScore: { not: null }, awayScore: { not: null } },
          },
        },
      },
      orderBy: { kickoffAt: "desc" },
      select: { roundId: true },
    }),
  ]);
  const mapVenueSummary = (venue: (typeof activeRoundFixturesRaw)[number]["venue"]): DashboardVenueSummary | null => {
    if (!venue) return null;
    return { id: venue.id, name: venue.name, imagePath: venue.imagePath };
  };

  const mapFixtureSummary = (
    fixture: (typeof activeRoundFixturesRaw)[number]
  ): DashboardFixtureSummary => ({
    id: fixture.id,
    kickoffAt: fixture.kickoffAt?.toISOString() ?? null,
    minute: null,
    venue: mapVenueSummary(fixture.venue),
    homeTeam: fixture.homeTeam ? toTeamSummary(fixture.homeTeam) : null,
    awayTeam: fixture.awayTeam ? toTeamSummary(fixture.awayTeam) : null,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    resultInfo: fixture.resultInfo,
    stateCode: fixture.stateId ? (stateNameById.get(fixture.stateId) ?? null) : null,
  });

  const lastCompletedRound = lastCompletedRoundAnchor?.roundId
    ? (allRounds.find((round) => round.id === lastCompletedRoundAnchor.roundId) ?? null)
    : null;

  return {
    data: {
      league: toLeagueSummary(currentSeason.league),
      season: toSeasonSummary(currentSeason),
      currentStage: currentStage ? toStageSummary(currentStage) : null,
      currentRound: activeRound ? toRoundSummary(activeRound) : null,
      lastCompletedRound: lastCompletedRound ? toRoundSummary(lastCompletedRound) : null,
      totalTeams,
      totalPlayers,
      totalFixtures,
      completedFixtures,
      upcomingFixtures: [],
      recentResults: activeRoundFixturesRaw.map(mapFixtureSummary),
      standings: standingsRaw.map(toStandingContract),
    },
  };
};

import type { DetailResponse } from "../../contracts/pagination.js";
import { getPrisma } from "../../database/index.js";
import { toLeagueSummary, toSeasonSummary, toStageSummary, toRoundSummary } from "../competition/competition.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toStandingContract } from "../standings/standings.mapper.js";
import type {
  DashboardOverviewContract,
  DashboardFixtureSummary,
} from "./dashboard.contracts.js";

export async function getDashboardOverview(): Promise<
  DetailResponse<DashboardOverviewContract>
> {
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
  const allRounds = currentSeason.stages.flatMap((stage) => stage.rounds);
  const currentRound = allRounds.find((round) => round.isCurrent) ?? null;

  const [
    totalTeams,
    totalPlayers,
    totalFixtures,
    completedFixtures,
    upcomingFixturesRaw,
    recentResultsRaw,
    standingsRaw,
  ] = await Promise.all([
    prisma.squadMembership.findMany({
      where: { seasonId: currentSeason.id },
      select: { teamId: true },
      distinct: ["teamId"],
    }).then((rows) => rows.length),
    prisma.squadMembership.findMany({
      where: { seasonId: currentSeason.id },
      select: { playerId: true },
      distinct: ["playerId"],
    }).then((rows) => rows.length),
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
        kickoffAt: { gte: new Date() },
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: "asc" },
      take: 5,
    }),
    prisma.fixture.findMany({
      where: {
        seasonId: currentSeason.id,
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: "desc" },
      take: 5,
    }),
    prisma.standing.findMany({
      where: {
        seasonId: currentSeason.id,
        ...(currentStage ? { stageId: currentStage.id } : {}),
      },
      include: { season: true, stage: true, team: true },
      orderBy: { position: "asc" },
    }),
  ]);

  const mapFixtureSummary = (fixture: typeof upcomingFixturesRaw[number]): DashboardFixtureSummary => ({
    id: fixture.id,
    kickoffAt: fixture.kickoffAt?.toISOString() ?? null,
    homeTeam: fixture.homeTeam ? toTeamSummary(fixture.homeTeam) : null,
    awayTeam: fixture.awayTeam ? toTeamSummary(fixture.awayTeam) : null,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    resultInfo: fixture.resultInfo,
  });

  return {
    data: {
      league: toLeagueSummary(currentSeason.league),
      season: toSeasonSummary(currentSeason),
      currentStage: currentStage ? toStageSummary(currentStage) : null,
      currentRound: currentRound ? toRoundSummary(currentRound) : null,
      totalTeams,
      totalPlayers,
      totalFixtures,
      completedFixtures,
      upcomingFixtures: upcomingFixturesRaw.map(mapFixtureSummary),
      recentResults: recentResultsRaw.map(mapFixtureSummary),
      standings: standingsRaw.map(toStandingContract),
    },
  };
}

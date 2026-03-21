import type { Standing, Season, Stage, Team } from "db";
import { toSeasonSummary, toStageSummary } from "../competition/competition.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import type { StandingContract } from "./standings.contracts.js";

type StandingWithRelations = Standing & {
  season: Season;
  stage: Stage | null;
  team: Team;
};

export function toStandingContract(
  standing: StandingWithRelations,
): StandingContract {
  return {
    id: standing.id,
    position: standing.position,
    points: standing.points,
    played: standing.played,
    won: standing.won,
    draw: standing.draw,
    lost: standing.lost,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    goalDifference: standing.goalsFor - standing.goalsAgainst,
    season: toSeasonSummary(standing.season),
    stage: standing.stage ? toStageSummary(standing.stage) : null,
    team: toTeamSummary(standing.team),
    createdAt: standing.createdAt.toISOString(),
    updatedAt: standing.updatedAt.toISOString(),
  };
}

import type { League, Season, Stage, Round, Group, Country } from "db";
import type { CountrySummary } from "../countries/countries.contracts.js";
import { toCountrySummary } from "../countries/countries.mapper.js";
import type {
  LeagueContract,
  LeagueSummary,
  SeasonContract,
  SeasonSummary,
  StageContract,
  StageSummary,
  RoundContract,
  RoundSummary,
  GroupContract,
  GroupSummary,
} from "./competition.contracts.js";
type LeagueWithCountry = League & {
  country: Country | null;
};
export const toLeagueContract = (league: LeagueWithCountry): LeagueContract => {
  return {
    id: league.id,
    sportmonksId: league.sportmonksId,
    name: league.name,
    shortCode: league.shortCode,
    imagePath: league.imagePath,
    country: league.country ? toCountrySummary(league.country) : null,
    createdAt: league.createdAt.toISOString(),
    updatedAt: league.updatedAt.toISOString(),
  };
};
export const toLeagueSummary = (league: League): LeagueSummary => {
  return {
    id: league.id,
    name: league.name,
    shortCode: league.shortCode,
    imagePath: league.imagePath,
  };
};
type SeasonWithLeague = Season & {
  league: League;
};
export const toSeasonContract = (season: SeasonWithLeague): SeasonContract => {
  return {
    id: season.id,
    sportmonksId: season.sportmonksId,
    name: season.name,
    isCurrent: season.isCurrent,
    startingAt: season.startingAt.toISOString(),
    endingAt: season.endingAt.toISOString(),
    league: toLeagueSummary(season.league),
    createdAt: season.createdAt.toISOString(),
    updatedAt: season.updatedAt.toISOString(),
  };
};
export const toSeasonSummary = (season: Season): SeasonSummary => {
  return {
    id: season.id,
    name: season.name,
    isCurrent: season.isCurrent,
  };
};
type StageWithSeason = Stage & {
  season: Season;
};
export const toStageContract = (stage: StageWithSeason): StageContract => {
  return {
    id: stage.id,
    sportmonksId: stage.sportmonksId,
    name: stage.name,
    type: stage.type,
    isCurrent: stage.isCurrent,
    season: toSeasonSummary(stage.season),
    createdAt: stage.createdAt.toISOString(),
    updatedAt: stage.updatedAt.toISOString(),
  };
};
export const toStageSummary = (stage: Stage): StageSummary => {
  return {
    id: stage.id,
    name: stage.name,
    type: stage.type,
    isCurrent: stage.isCurrent,
  };
};
type RoundWithStage = Round & {
  stage: Stage;
};
export const toRoundContract = (round: RoundWithStage): RoundContract => {
  return {
    id: round.id,
    sportmonksId: round.sportmonksId,
    name: round.name,
    slug: round.slug,
    isCurrent: round.isCurrent,
    stage: toStageSummary(round.stage),
    createdAt: round.createdAt.toISOString(),
    updatedAt: round.updatedAt.toISOString(),
  };
};
export const toRoundSummary = (round: Round): RoundSummary => {
  return {
    id: round.id,
    name: round.name,
    isCurrent: round.isCurrent,
  };
};
type GroupWithStage = Group & {
  stage: Stage;
};
export const toGroupContract = (group: GroupWithStage): GroupContract => {
  return {
    id: group.id,
    sportmonksId: group.sportmonksId,
    name: group.name,
    stage: toStageSummary(group.stage),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
};
export const toGroupSummary = (group: Group): GroupSummary => {
  return {
    id: group.id,
    name: group.name,
  };
};

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

// --- League ---

type LeagueWithCountry = League & { country: Country | null };

export function toLeagueContract(league: LeagueWithCountry): LeagueContract {
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
}

export function toLeagueSummary(league: League): LeagueSummary {
  return {
    id: league.id,
    name: league.name,
    shortCode: league.shortCode,
    imagePath: league.imagePath,
  };
}

// --- Season ---

type SeasonWithLeague = Season & { league: League };

export function toSeasonContract(season: SeasonWithLeague): SeasonContract {
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
}

export function toSeasonSummary(season: Season): SeasonSummary {
  return {
    id: season.id,
    name: season.name,
    isCurrent: season.isCurrent,
  };
}

// --- Stage ---

type StageWithSeason = Stage & { season: Season };

export function toStageContract(stage: StageWithSeason): StageContract {
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
}

export function toStageSummary(stage: Stage): StageSummary {
  return {
    id: stage.id,
    name: stage.name,
    type: stage.type,
    isCurrent: stage.isCurrent,
  };
}

// --- Round ---

type RoundWithStage = Round & { stage: Stage };

export function toRoundContract(round: RoundWithStage): RoundContract {
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
}

export function toRoundSummary(round: Round): RoundSummary {
  return {
    id: round.id,
    name: round.name,
    isCurrent: round.isCurrent,
  };
}

// --- Group ---

type GroupWithStage = Group & { stage: Stage };

export function toGroupContract(group: GroupWithStage): GroupContract {
  return {
    id: group.id,
    sportmonksId: group.sportmonksId,
    name: group.name,
    stage: toStageSummary(group.stage),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export function toGroupSummary(group: Group): GroupSummary {
  return {
    id: group.id,
    name: group.name,
  };
}

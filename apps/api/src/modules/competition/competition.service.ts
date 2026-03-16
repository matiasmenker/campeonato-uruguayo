import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type {
  LeaguesQuery,
  LeagueContract,
  SeasonsQuery,
  SeasonContract,
  StagesQuery,
  StageContract,
  RoundsQuery,
  RoundContract,
  GroupsQuery,
  GroupContract,
  CurrentCompetitionContract,
} from "./competition.contracts.js";
import {
  toLeagueContract,
  toLeagueSummary,
  toSeasonContract,
  toSeasonSummary,
  toStageContract,
  toStageSummary,
  toRoundContract,
  toRoundSummary,
  toGroupContract,
} from "./competition.mapper.js";
import {
  findLeagues,
  findLeagueById,
  findSeasons,
  findSeasonById,
  findStages,
  findStageById,
  findRounds,
  findRoundById,
  findGroups,
  findGroupById,
  findCurrentSeason,
} from "./competition.repository.js";

// --- League ---

export async function listLeagues(
  query: LeaguesQuery,
): Promise<PaginatedResponse<LeagueContract>> {
  const { leagues, totalItems } = await findLeagues(query);
  return {
    data: leagues.map(toLeagueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getLeague(
  id: number,
): Promise<DetailResponse<LeagueContract>> {
  const league = await findLeagueById(id);
  if (!league) throw new NotFoundError("League");
  return { data: toLeagueContract(league) };
}

// --- Season ---

export async function listSeasons(
  query: SeasonsQuery,
): Promise<PaginatedResponse<SeasonContract>> {
  const { seasons, totalItems } = await findSeasons(query);
  return {
    data: seasons.map(toSeasonContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getSeason(
  id: number,
): Promise<DetailResponse<SeasonContract>> {
  const season = await findSeasonById(id);
  if (!season) throw new NotFoundError("Season");
  return { data: toSeasonContract(season) };
}

// --- Stage ---

export async function listStages(
  query: StagesQuery,
): Promise<PaginatedResponse<StageContract>> {
  const { stages, totalItems } = await findStages(query);
  return {
    data: stages.map(toStageContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getStage(
  id: number,
): Promise<DetailResponse<StageContract>> {
  const stage = await findStageById(id);
  if (!stage) throw new NotFoundError("Stage");
  return { data: toStageContract(stage) };
}

// --- Round ---

export async function listRounds(
  query: RoundsQuery,
): Promise<PaginatedResponse<RoundContract>> {
  const { rounds, totalItems } = await findRounds(query);
  return {
    data: rounds.map(toRoundContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getRound(
  id: number,
): Promise<DetailResponse<RoundContract>> {
  const round = await findRoundById(id);
  if (!round) throw new NotFoundError("Round");
  return { data: toRoundContract(round) };
}

// --- Group ---

export async function listGroups(
  query: GroupsQuery,
): Promise<PaginatedResponse<GroupContract>> {
  const { groups, totalItems } = await findGroups(query);
  return {
    data: groups.map(toGroupContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getGroup(
  id: number,
): Promise<DetailResponse<GroupContract>> {
  const group = await findGroupById(id);
  if (!group) throw new NotFoundError("Group");
  return { data: toGroupContract(group) };
}

// --- Current Competition ---

export async function getCurrentCompetition(): Promise<
  DetailResponse<CurrentCompetitionContract>
> {
  const currentSeason = await findCurrentSeason();

  if (!currentSeason) {
    return {
      data: {
        league: null,
        season: null,
        stages: [],
        currentRound: null,
      },
    };
  }

  const allRounds = currentSeason.stages.flatMap((stage) => stage.rounds);
  const currentRound = allRounds.find((round) => round.isCurrent) ?? null;

  return {
    data: {
      league: toLeagueSummary(currentSeason.league),
      season: toSeasonSummary(currentSeason),
      stages: currentSeason.stages.map(toStageSummary),
      currentRound: currentRound ? toRoundSummary(currentRound) : null,
    },
  };
}

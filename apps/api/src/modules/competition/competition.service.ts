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
export const listLeagues = async (
  query: LeaguesQuery
): Promise<PaginatedResponse<LeagueContract>> => {
  const { leagues, totalItems } = await findLeagues(query);
  return {
    data: leagues.map(toLeagueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getLeague = async (id: number): Promise<DetailResponse<LeagueContract>> => {
  const league = await findLeagueById(id);
  if (!league) throw new NotFoundError("League");
  return { data: toLeagueContract(league) };
};
export const listSeasons = async (
  query: SeasonsQuery
): Promise<PaginatedResponse<SeasonContract>> => {
  const { seasons, totalItems } = await findSeasons(query);
  return {
    data: seasons.map(toSeasonContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getSeason = async (id: number): Promise<DetailResponse<SeasonContract>> => {
  const season = await findSeasonById(id);
  if (!season) throw new NotFoundError("Season");
  return { data: toSeasonContract(season) };
};
export const listStages = async (query: StagesQuery): Promise<PaginatedResponse<StageContract>> => {
  const { stages, totalItems } = await findStages(query);
  return {
    data: stages.map(toStageContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getStage = async (id: number): Promise<DetailResponse<StageContract>> => {
  const stage = await findStageById(id);
  if (!stage) throw new NotFoundError("Stage");
  return { data: toStageContract(stage) };
};
export const listRounds = async (query: RoundsQuery): Promise<PaginatedResponse<RoundContract>> => {
  const { rounds, totalItems } = await findRounds(query);
  return {
    data: rounds.map(toRoundContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getRound = async (id: number): Promise<DetailResponse<RoundContract>> => {
  const round = await findRoundById(id);
  if (!round) throw new NotFoundError("Round");
  return { data: toRoundContract(round) };
};
export const listGroups = async (query: GroupsQuery): Promise<PaginatedResponse<GroupContract>> => {
  const { groups, totalItems } = await findGroups(query);
  return {
    data: groups.map(toGroupContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getGroup = async (id: number): Promise<DetailResponse<GroupContract>> => {
  const group = await findGroupById(id);
  if (!group) throw new NotFoundError("Group");
  return { data: toGroupContract(group) };
};
export const getCurrentCompetition = async (): Promise<
  DetailResponse<CurrentCompetitionContract>
> => {
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
};

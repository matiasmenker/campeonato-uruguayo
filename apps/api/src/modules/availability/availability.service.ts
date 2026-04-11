import type { PaginatedResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import type {
  MarketValuesQuery,
  PlayerMarketValueContract,
  InjuriesQuery,
  InjuryContract,
  SuspensionsQuery,
  SuspensionContract,
} from "./availability.contracts.js";
import {
  toMarketValueContract,
  toInjuryContract,
  toSuspensionContract,
} from "./availability.mapper.js";
import {
  findMarketValues,
  findMarketValuesByPlayerId,
  findInjuries,
  findInjuriesByPlayerId,
  findSuspensions,
  findSuspensionsByPlayerId,
} from "./availability.repository.js";
export const listMarketValues = async (
  query: MarketValuesQuery
): Promise<PaginatedResponse<PlayerMarketValueContract>> => {
  const { marketValues, totalItems } = await findMarketValues(query);
  return {
    data: marketValues.map(toMarketValueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const listPlayerMarketValues = async (
  playerId: number,
  query: MarketValuesQuery
): Promise<PaginatedResponse<PlayerMarketValueContract>> => {
  const { marketValues, totalItems } = await findMarketValuesByPlayerId(playerId, query);
  return {
    data: marketValues.map(toMarketValueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const listInjuries = async (
  query: InjuriesQuery
): Promise<PaginatedResponse<InjuryContract>> => {
  const { injuries, totalItems } = await findInjuries(query);
  return {
    data: injuries.map(toInjuryContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const listPlayerInjuries = async (
  playerId: number,
  query: InjuriesQuery
): Promise<PaginatedResponse<InjuryContract>> => {
  const { injuries, totalItems } = await findInjuriesByPlayerId(playerId, query);
  return {
    data: injuries.map(toInjuryContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const listSuspensions = async (
  query: SuspensionsQuery
): Promise<PaginatedResponse<SuspensionContract>> => {
  const { suspensions, totalItems } = await findSuspensions(query);
  return {
    data: suspensions.map(toSuspensionContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const listPlayerSuspensions = async (
  playerId: number,
  query: SuspensionsQuery
): Promise<PaginatedResponse<SuspensionContract>> => {
  const { suspensions, totalItems } = await findSuspensionsByPlayerId(playerId, query);
  return {
    data: suspensions.map(toSuspensionContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};

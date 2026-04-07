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

export async function listMarketValues(
  query: MarketValuesQuery,
): Promise<PaginatedResponse<PlayerMarketValueContract>> {
  const { marketValues, totalItems } = await findMarketValues(query);
  return {
    data: marketValues.map(toMarketValueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listPlayerMarketValues(
  playerId: number,
  query: MarketValuesQuery,
): Promise<PaginatedResponse<PlayerMarketValueContract>> {
  const { marketValues, totalItems } = await findMarketValuesByPlayerId(playerId, query);
  return {
    data: marketValues.map(toMarketValueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listInjuries(
  query: InjuriesQuery,
): Promise<PaginatedResponse<InjuryContract>> {
  const { injuries, totalItems } = await findInjuries(query);
  return {
    data: injuries.map(toInjuryContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listPlayerInjuries(
  playerId: number,
  query: InjuriesQuery,
): Promise<PaginatedResponse<InjuryContract>> {
  const { injuries, totalItems } = await findInjuriesByPlayerId(playerId, query);
  return {
    data: injuries.map(toInjuryContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listSuspensions(
  query: SuspensionsQuery,
): Promise<PaginatedResponse<SuspensionContract>> {
  const { suspensions, totalItems } = await findSuspensions(query);
  return {
    data: suspensions.map(toSuspensionContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listPlayerSuspensions(
  playerId: number,
  query: SuspensionsQuery,
): Promise<PaginatedResponse<SuspensionContract>> {
  const { suspensions, totalItems } = await findSuspensionsByPlayerId(playerId, query);
  return {
    data: suspensions.map(toSuspensionContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { StatTypesQuery, StatTypeContract } from "./stat-types.contracts.js";
import { toStatTypeContract } from "./stat-types.mapper.js";
import { findStatTypes, findStatTypeById } from "./stat-types.repository.js";

export async function listStatTypes(
  query: StatTypesQuery
): Promise<PaginatedResponse<StatTypeContract>> {
  const { statTypes, totalItems } = await findStatTypes(query);

  return {
    data: statTypes.map(toStatTypeContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getStatType(id: number): Promise<DetailResponse<StatTypeContract>> {
  const statType = await findStatTypeById(id);

  if (!statType) {
    throw new NotFoundError("Stat type");
  }

  return { data: toStatTypeContract(statType) };
}

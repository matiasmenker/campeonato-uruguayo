import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { RefereesQuery, RefereeContract } from "./referees.contracts.js";
import { toRefereeContract } from "./referees.mapper.js";
import { findReferees, findRefereeById } from "./referees.repository.js";

export async function listReferees(
  query: RefereesQuery
): Promise<PaginatedResponse<RefereeContract>> {
  const { referees, totalItems } = await findReferees(query);
  return {
    data: referees.map(toRefereeContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getReferee(id: number): Promise<DetailResponse<RefereeContract>> {
  const referee = await findRefereeById(id);
  if (!referee) throw new NotFoundError("Referee");
  return { data: toRefereeContract(referee) };
}

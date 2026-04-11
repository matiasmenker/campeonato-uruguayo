import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { StandingsQuery, StandingContract } from "./standings.contracts.js";
import { toStandingContract } from "./standings.mapper.js";
import { findStandings, findStandingById } from "./standings.repository.js";
export const listStandings = async (
  query: StandingsQuery
): Promise<PaginatedResponse<StandingContract>> => {
  const { standings, totalItems } = await findStandings(query);
  return {
    data: standings.map(toStandingContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getStanding = async (id: number): Promise<DetailResponse<StandingContract>> => {
  const standing = await findStandingById(id);
  if (!standing) throw new NotFoundError("Standing");
  return { data: toStandingContract(standing) };
};

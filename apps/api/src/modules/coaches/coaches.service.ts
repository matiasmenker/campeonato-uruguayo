import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { CoachesQuery, CoachContract } from "./coaches.contracts.js";
import { toCoachContract } from "./coaches.mapper.js";
import { findCoaches, findCoachById, findCoachesByTeamId } from "./coaches.repository.js";
export const listCoaches = async (
  query: CoachesQuery
): Promise<PaginatedResponse<CoachContract>> => {
  const { coaches, totalItems } = await findCoaches(query);
  return {
    data: coaches.map(toCoachContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getCoach = async (id: number): Promise<DetailResponse<CoachContract>> => {
  const coach = await findCoachById(id);
  if (!coach) throw new NotFoundError("Coach");
  return { data: toCoachContract(coach) };
};
export const listTeamCoaches = async (teamId: number): Promise<DetailResponse<CoachContract[]>> => {
  const coaches = await findCoachesByTeamId(teamId);
  return {
    data: coaches.map(toCoachContract),
  };
};

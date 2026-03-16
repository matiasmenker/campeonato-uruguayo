import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { CoachesQuery, CoachContract } from "./coaches.contracts.js";
import { toCoachContract } from "./coaches.mapper.js";
import {
  findCoaches,
  findCoachById,
  findCoachesByTeamId,
  findTeamsByIds,
} from "./coaches.repository.js";

export async function listCoaches(
  query: CoachesQuery,
): Promise<PaginatedResponse<CoachContract>> {
  const { coaches, totalItems } = await findCoaches(query);

  const teamIds = coaches
    .map((coach) => coach.teamId)
    .filter((id): id is number => id !== null);
  const teamsMap = await findTeamsByIds(teamIds);

  return {
    data: coaches.map((coach) =>
      toCoachContract(coach, coach.teamId ? teamsMap.get(coach.teamId) ?? null : null),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getCoach(
  id: number,
): Promise<DetailResponse<CoachContract>> {
  const coach = await findCoachById(id);
  if (!coach) throw new NotFoundError("Coach");

  const teamsMap = coach.teamId ? await findTeamsByIds([coach.teamId]) : new Map();
  const team = coach.teamId ? teamsMap.get(coach.teamId) ?? null : null;

  return { data: toCoachContract(coach, team) };
}

export async function listTeamCoaches(
  teamId: number,
): Promise<DetailResponse<CoachContract[]>> {
  const coaches = await findCoachesByTeamId(teamId);

  const teamsMap = await findTeamsByIds([teamId]);
  const team = teamsMap.get(teamId) ?? null;

  if (!team) throw new NotFoundError("Team");

  return {
    data: coaches.map((coach) => toCoachContract(coach, team)),
  };
}

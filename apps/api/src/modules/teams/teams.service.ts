import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { TeamsQuery, TeamContract } from "./teams.contracts.js";
import { toTeamContract } from "./teams.mapper.js";
import { findTeams, findTeamById } from "./teams.repository.js";

export async function listTeams(query: TeamsQuery): Promise<PaginatedResponse<TeamContract>> {
  const { teams, totalItems } = await findTeams(query);
  return {
    data: teams.map(toTeamContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getTeam(id: number): Promise<DetailResponse<TeamContract>> {
  const team = await findTeamById(id);
  if (!team) throw new NotFoundError("Team");
  return { data: toTeamContract(team) };
}

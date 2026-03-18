import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError, BadRequestError } from "../../http/errors.js";
import type {
  SquadMembershipsQuery,
  SquadMembershipContract,
  TeamSquadQuery,
} from "./squad-memberships.contracts.js";
import { toSquadMembershipContract } from "./squad-memberships.mapper.js";
import {
  findSquadMemberships,
  findSquadMembershipById,
  findTeamSquad,
  findCurrentSeasonId,
} from "./squad-memberships.repository.js";

export async function listSquadMemberships(
  query: SquadMembershipsQuery,
): Promise<PaginatedResponse<SquadMembershipContract>> {
  const { memberships, totalItems } = await findSquadMemberships(query);
  return {
    data: memberships.map(toSquadMembershipContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getSquadMembership(
  id: number,
): Promise<DetailResponse<SquadMembershipContract>> {
  const membership = await findSquadMembershipById(id);
  if (!membership) throw new NotFoundError("Squad membership");
  return { data: toSquadMembershipContract(membership) };
}

export async function getTeamSquad(
  teamId: number,
  query: TeamSquadQuery,
): Promise<DetailResponse<SquadMembershipContract[]>> {
  let seasonId = query.seasonId ?? null;

  if (!seasonId) {
    seasonId = await findCurrentSeasonId();
    if (!seasonId) {
      throw new BadRequestError("No current season found. Please provide a seasonId.");
    }
  }

  const memberships = await findTeamSquad(teamId, seasonId);
  return {
    data: memberships.map(toSquadMembershipContract),
  };
}

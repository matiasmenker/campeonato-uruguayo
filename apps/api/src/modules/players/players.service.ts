import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { PlayersQuery, PlayerContract } from "./players.contracts.js";
import { toPlayerContract } from "./players.mapper.js";
import { findPlayers, findPlayerById } from "./players.repository.js";

export async function listPlayers(
  query: PlayersQuery,
): Promise<PaginatedResponse<PlayerContract>> {
  const { players, totalItems } = await findPlayers(query);
  return {
    data: players.map(toPlayerContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getPlayer(
  id: number,
): Promise<DetailResponse<PlayerContract>> {
  const player = await findPlayerById(id);
  if (!player) throw new NotFoundError("Player");
  return { data: toPlayerContract(player) };
}

import type { Player } from "db";
import type { PlayerContract, PlayerSummary } from "./players.contracts.js";

export function toPlayerContract(player: Player): PlayerContract {
  return {
    id: player.id,
    sportmonksId: player.sportmonksId,
    name: player.name,
    displayName: player.displayName,
    imagePath: player.imagePath,
    positionId: player.positionId,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
  };
}

export function toPlayerSummary(player: Player): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    displayName: player.displayName,
    imagePath: player.imagePath,
    positionId: player.positionId,
  };
}

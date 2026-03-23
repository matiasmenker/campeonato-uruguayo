import type { Player, Country } from "db";
import type { PlayerContract, PlayerSummary } from "./players.contracts.js";

type PlayerWithCountry = Player & { country: Country | null };

export function toPlayerContract(player: PlayerWithCountry): PlayerContract {
  return {
    id: player.id,
    sportmonksId: player.sportmonksId,
    name: player.name,
    commonName: player.commonName,
    firstName: player.firstName,
    lastName: player.lastName,
    displayName: player.displayName,
    imagePath: player.imagePath,
    positionId: player.positionId,
    detailedPositionId: player.detailedPositionId,
    dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
    height: player.height,
    weight: player.weight,
    gender: player.gender,
    country: player.country
      ? { id: player.country.id, name: player.country.name, imageUrl: player.country.imageUrl }
      : null,
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

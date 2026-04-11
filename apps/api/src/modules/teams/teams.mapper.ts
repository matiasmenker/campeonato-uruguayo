import type { Team } from "db";
import type { TeamContract, TeamSummary } from "./teams.contracts.js";
export const toTeamContract = (team: Team): TeamContract => {
  return {
    id: team.id,
    sportmonksId: team.sportmonksId,
    name: team.name,
    shortCode: team.shortCode,
    imagePath: team.imagePath,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
};
export const toTeamSummary = (team: Team): TeamSummary => {
  return {
    id: team.id,
    name: team.name,
    shortCode: team.shortCode,
    imagePath: team.imagePath,
  };
};

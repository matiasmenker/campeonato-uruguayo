import type { Coach, Team } from "db";
import { toTeamSummary } from "../teams/teams.mapper.js";
import type { CoachContract } from "./coaches.contracts.js";

export function toCoachContract(
  coach: Coach,
  team: Team | null,
): CoachContract {
  return {
    id: coach.id,
    sportmonksId: coach.sportmonksId,
    name: coach.name,
    imagePath: coach.imagePath,
    teamId: coach.teamId,
    team: team ? toTeamSummary(team) : null,
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  };
}

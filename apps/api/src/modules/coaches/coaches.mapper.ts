import type { Coach, CoachAssignment, Team, Season } from "db";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toSeasonSummary } from "../competition/competition.mapper.js";
import type { CoachContract } from "./coaches.contracts.js";
type CoachWithAssignments = Coach & {
  assignments: (CoachAssignment & {
    team: Team;
    season: Season;
  })[];
};
export const toCoachContract = (coach: CoachWithAssignments): CoachContract => {
  return {
    id: coach.id,
    sportmonksId: coach.sportmonksId,
    name: coach.name,
    imagePath: coach.imagePath,
    assignments: coach.assignments.map((a) => ({
      team: toTeamSummary(a.team),
      season: toSeasonSummary(a.season),
    })),
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  };
};

import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { TeamSummary } from "../teams/teams.contracts.js";
import type { SeasonSummary } from "../competition/competition.contracts.js";

export const coachesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  teamId: z.coerce.number().int().positive().optional(),
  seasonId: z.coerce.number().int().positive().optional(),
});

export type CoachesQuery = z.infer<typeof coachesQuerySchema>;

export const coachIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const teamCoachesParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface CoachAssignmentContract {
  team: TeamSummary;
  season: SeasonSummary;
}

export interface CoachContract {
  id: number;
  sportmonksId: number;
  name: string;
  imagePath: string | null;
  assignments: CoachAssignmentContract[];
  createdAt: string;
  updatedAt: string;
}

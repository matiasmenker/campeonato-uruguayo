import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { TeamSummary } from "../teams/teams.contracts.js";

export const coachesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  teamId: z.coerce.number().int().positive().optional(),
});

export type CoachesQuery = z.infer<typeof coachesQuerySchema>;

export const coachIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const teamCoachesParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface CoachContract {
  id: number;
  sportmonksId: number;
  name: string;
  imagePath: string | null;
  teamId: number | null;
  team: TeamSummary | null;
  createdAt: string;
  updatedAt: string;
}

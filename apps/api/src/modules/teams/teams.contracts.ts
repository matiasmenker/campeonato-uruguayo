import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";

export const teamsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  seasonId: z.coerce.number().int().positive().optional(),
});

export type TeamsQuery = z.infer<typeof teamsQuerySchema>;

export const teamIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface TeamContract {
  id: number;
  sportmonksId: number;
  name: string;
  shortCode: string | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamSummary {
  id: number;
  name: string;
  shortCode: string | null;
  imagePath: string | null;
}

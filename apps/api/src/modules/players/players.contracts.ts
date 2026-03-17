import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";

export const playersQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  positionId: z.coerce.number().int().positive().optional(),
});

export type PlayersQuery = z.infer<typeof playersQuerySchema>;

export const playerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface PlayerContract {
  id: number;
  sportmonksId: number;
  name: string;
  displayName: string | null;
  imagePath: string | null;
  positionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerSummary {
  id: number;
  name: string;
  displayName: string | null;
  imagePath: string | null;
  positionId: number | null;
}

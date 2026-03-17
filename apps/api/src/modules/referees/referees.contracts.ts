import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";

export const refereesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export type RefereesQuery = z.infer<typeof refereesQuerySchema>;

export const refereeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface RefereeContract {
  id: number;
  sportmonksId: number;
  name: string;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefereeSummary {
  id: number;
  name: string;
}

import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";

export const statTypesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  modelType: z.string().optional(),
  statGroup: z.string().optional(),
});

export type StatTypesQuery = z.infer<typeof statTypesQuerySchema>;

export const statTypeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface StatTypeContract {
  id: number;
  name: string;
  developerName: string | null;
  modelType: string | null;
  statGroup: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatTypeSummary {
  id: number;
  name: string;
  developerName: string | null;
}

import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";

export const fixtureStatesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export type FixtureStatesQuery = z.infer<typeof fixtureStatesQuerySchema>;

export const fixtureStateIdParamSchema = z.object({
  id: z.coerce.number().int(),
});

export interface FixtureStateContract {
  id: number;
  state: string | null;
  name: string;
  shortName: string | null;
  developerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixtureStateSummary {
  id: number;
  state: string | null;
  name: string;
  shortName: string | null;
  developerName: string | null;
}

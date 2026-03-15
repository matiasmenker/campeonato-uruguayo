import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";

export const countriesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export type CountriesQuery = z.infer<typeof countriesQuerySchema>;

export const countryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface CountryContract {
  id: number;
  sportmonksId: number;
  name: string;
  officialName: string;
  code: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySummary {
  id: number;
  name: string;
  code: string;
  imageUrl: string;
}

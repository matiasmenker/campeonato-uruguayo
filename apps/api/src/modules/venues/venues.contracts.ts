import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { CountrySummary } from "../countries/countries.contracts.js";

export const citiesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  countryId: z.coerce.number().int().positive().optional(),
});

export type CitiesQuery = z.infer<typeof citiesQuerySchema>;

export const venuesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  countryId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
});

export type VenuesQuery = z.infer<typeof venuesQuerySchema>;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface CityContract {
  id: number;
  sportmonksId: number;
  name: string;
  country: CountrySummary;
  createdAt: string;
  updatedAt: string;
}

export interface CitySummary {
  id: number;
  name: string;
}

export interface VenueContract {
  id: number;
  sportmonksId: number;
  name: string;
  city: string | null;
  cityRecord: CitySummary | null;
  country: CountrySummary | null;
  capacity: number | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueSummary {
  id: number;
  name: string;
  city: string | null;
  capacity: number | null;
  imagePath: string | null;
}

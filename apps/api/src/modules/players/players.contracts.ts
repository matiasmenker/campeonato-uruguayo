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

export interface CountrySummaryInPlayer {
  id: number;
  name: string;
  imageUrl: string;
}

export interface PlayerContract {
  id: number;
  sportmonksId: number | null;
  name: string;
  commonName: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  imagePath: string | null;
  positionId: number | null;
  detailedPositionId: number | null;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  country: CountrySummaryInPlayer | null;
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

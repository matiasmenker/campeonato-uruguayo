import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { PlayerSummary } from "../players/players.contracts.js";

export const playerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const marketValuesQuerySchema = paginationQuerySchema.extend({
  playerId: z.coerce.number().int().positive().optional(),
});

export type MarketValuesQuery = z.infer<typeof marketValuesQuerySchema>;

export interface PlayerMarketValueContract {
  id: number;
  sportmonksId: number;
  player: PlayerSummary;
  value: string;
  currency: string | null;
  date: string | null;
  createdAt: string;
  updatedAt: string;
}

export const injuriesQuerySchema = paginationQuerySchema.extend({
  playerId: z.coerce.number().int().positive().optional(),
});

export type InjuriesQuery = z.infer<typeof injuriesQuerySchema>;

export interface InjuryContract {
  id: number;
  sportmonksId: number;
  player: PlayerSummary;
  type: string | null;
  reason: string | null;
  startDate: string | null;
  expectedReturn: string | null;
  createdAt: string;
  updatedAt: string;
}

export const suspensionsQuerySchema = paginationQuerySchema.extend({
  playerId: z.coerce.number().int().positive().optional(),
});

export type SuspensionsQuery = z.infer<typeof suspensionsQuerySchema>;

export interface SuspensionContract {
  id: number;
  sportmonksId: number;
  player: PlayerSummary;
  reason: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

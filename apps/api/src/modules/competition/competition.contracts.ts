import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { CountrySummary } from "../countries/countries.contracts.js";

// --- Query schemas ---

export const leaguesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  countryId: z.coerce.number().int().positive().optional(),
});

export type LeaguesQuery = z.infer<typeof leaguesQuerySchema>;

export const seasonsQuerySchema = paginationQuerySchema.extend({
  leagueId: z.coerce.number().int().positive().optional(),
  isCurrent: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type SeasonsQuery = z.infer<typeof seasonsQuerySchema>;

export const stagesQuerySchema = paginationQuerySchema.extend({
  seasonId: z.coerce.number().int().positive().optional(),
});

export type StagesQuery = z.infer<typeof stagesQuerySchema>;

export const roundsQuerySchema = paginationQuerySchema.extend({
  stageId: z.coerce.number().int().positive().optional(),
});

export type RoundsQuery = z.infer<typeof roundsQuerySchema>;

export const groupsQuerySchema = paginationQuerySchema.extend({
  stageId: z.coerce.number().int().positive().optional(),
});

export type GroupsQuery = z.infer<typeof groupsQuerySchema>;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// --- Response contracts ---

export interface LeagueContract {
  id: number;
  sportmonksId: number;
  name: string;
  shortCode: string | null;
  imagePath: string | null;
  country: CountrySummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeagueSummary {
  id: number;
  name: string;
  shortCode: string | null;
  imagePath: string | null;
}

export interface SeasonContract {
  id: number;
  sportmonksId: number;
  name: string;
  isCurrent: boolean;
  startingAt: string;
  endingAt: string;
  league: LeagueSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonSummary {
  id: number;
  name: string;
  isCurrent: boolean;
}

export interface StageContract {
  id: number;
  sportmonksId: number;
  name: string;
  type: string | null;
  isCurrent: boolean;
  season: SeasonSummary;
  createdAt: string;
  updatedAt: string;
}

export interface StageSummary {
  id: number;
  name: string;
  type: string | null;
  isCurrent: boolean;
}

export interface RoundContract {
  id: number;
  sportmonksId: number;
  name: string;
  slug: string | null;
  isCurrent: boolean;
  stage: StageSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RoundSummary {
  id: number;
  name: string;
  isCurrent: boolean;
}

export interface GroupContract {
  id: number;
  sportmonksId: number;
  name: string | null;
  stage: StageSummary;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSummary {
  id: number;
  name: string | null;
}

export interface CurrentCompetitionContract {
  league: LeagueSummary | null;
  season: SeasonSummary | null;
  stages: StageSummary[];
  currentRound: RoundSummary | null;
}

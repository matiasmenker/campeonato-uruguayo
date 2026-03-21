import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { SeasonSummary, StageSummary } from "../competition/competition.contracts.js";
import type { TeamSummary } from "../teams/teams.contracts.js";

export const standingsQuerySchema = paginationQuerySchema.extend({
  seasonId: z.coerce.number().int().positive().optional(),
  stageId: z.coerce.number().int().positive().optional(),
  teamId: z.coerce.number().int().positive().optional(),
});

export type StandingsQuery = z.infer<typeof standingsQuerySchema>;

export const standingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface StandingContract {
  id: number;
  position: number;
  points: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  season: SeasonSummary;
  stage: StageSummary | null;
  team: TeamSummary;
  createdAt: string;
  updatedAt: string;
}

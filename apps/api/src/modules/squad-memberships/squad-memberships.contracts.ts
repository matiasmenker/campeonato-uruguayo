import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { TeamSummary } from "../teams/teams.contracts.js";
import type { PlayerSummary } from "../players/players.contracts.js";
import type { SeasonSummary } from "../competition/competition.contracts.js";

export const squadMembershipsQuerySchema = paginationQuerySchema.extend({
  teamId: z.coerce.number().int().positive().optional(),
  playerId: z.coerce.number().int().positive().optional(),
  seasonId: z.coerce.number().int().positive().optional(),
});

export type SquadMembershipsQuery = z.infer<typeof squadMembershipsQuerySchema>;

export const squadMembershipIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const teamSquadParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const teamSquadQuerySchema = z.object({
  seasonId: z.coerce.number().int().positive().optional(),
});

export type TeamSquadQuery = z.infer<typeof teamSquadQuerySchema>;

export interface SquadMembershipContract {
  id: number;
  player: PlayerSummary;
  team: TeamSummary;
  season: SeasonSummary;
  from: string;
  to: string | null;
  shirtNumber: number | null;
  isLoan: boolean;
  createdAt: string;
  updatedAt: string;
}

import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { PlayerSummary } from "../players/players.contracts.js";
import type { TeamSummary } from "../teams/teams.contracts.js";

export const transfersQuerySchema = paginationQuerySchema.extend({
  playerId: z.coerce.number().int().positive().optional(),
  teamId: z.coerce.number().int().positive().optional(),
  type: z.string().optional(),
});

export type TransfersQuery = z.infer<typeof transfersQuerySchema>;

export const transferIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface TransferContract {
  id: number;
  sportmonksId: number;
  player: PlayerSummary;
  fromTeam: TeamSummary | null;
  toTeam: TeamSummary | null;
  type: string | null;
  date: string | null;
  amount: string | null;
  createdAt: string;
  updatedAt: string;
}

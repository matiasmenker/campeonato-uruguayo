import { z } from "zod";
import type { PlayerSummary } from "../players/players.contracts.js";
import type { TeamSummary } from "../teams/teams.contracts.js";
import type { StatTypeSummary } from "../stat-types/stat-types.contracts.js";

export const leadersQuerySchema = z.object({
  seasonId: z.coerce.number().int().positive().optional(),
  stageId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type LeadersQuery = z.infer<typeof leadersQuerySchema>;

export interface LeaderEntry {
  player: PlayerSummary;
  team: TeamSummary | null;
  value: number;
}

export interface LeaderCategory {
  category: string;
  statType: StatTypeSummary | null;
  leaders: LeaderEntry[];
}

export interface LeadersContract {
  topScorers: LeaderCategory;
  topAssists: LeaderCategory;
  topYellowCards: LeaderCategory;
  topRedCards: LeaderCategory;
}

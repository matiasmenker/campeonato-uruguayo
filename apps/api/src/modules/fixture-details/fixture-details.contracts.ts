import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { PlayerSummary } from "../players/players.contracts.js";
import type { TeamSummary } from "../teams/teams.contracts.js";
import type { FixtureStateSummary } from "../fixture-states/fixture-states.contracts.js";
import type { StatTypeSummary } from "../stat-types/stat-types.contracts.js";

// --- Param schemas ---

export const fixtureIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const resourceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// --- Change Logs ---

export const changeLogsQuerySchema = paginationQuerySchema.extend({
  fixtureId: z.coerce.number().int().positive().optional(),
});

export type ChangeLogsQuery = z.infer<typeof changeLogsQuerySchema>;

export interface ChangeLogContract {
  id: number;
  fixtureId: number;
  previousStateId: number | null;
  previousState: FixtureStateSummary | null;
  nextStateId: number | null;
  nextState: FixtureStateSummary | null;
  previousKickoffAt: string | null;
  nextKickoffAt: string | null;
  previousResultInfo: string | null;
  nextResultInfo: string | null;
  detectedAt: string;
}

// --- Events ---

export const eventsQuerySchema = paginationQuerySchema.extend({
  fixtureId: z.coerce.number().int().positive().optional(),
  playerId: z.coerce.number().int().positive().optional(),
  typeId: z.coerce.number().int().positive().optional(),
});

export type EventsQuery = z.infer<typeof eventsQuerySchema>;

export interface EventContract {
  id: number;
  sportmonksId: number;
  fixtureId: number;
  player: PlayerSummary | null;
  typeId: number | null;
  sortOrder: number | null;
  minute: number | null;
  extraMinute: number | null;
  result: string | null;
  info: string | null;
  addition: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Lineups ---

export const lineupsQuerySchema = paginationQuerySchema.extend({
  fixtureId: z.coerce.number().int().positive().optional(),
  playerId: z.coerce.number().int().positive().optional(),
});

export type LineupsQuery = z.infer<typeof lineupsQuerySchema>;

export type LineupTeamResolution = "resolved" | "unresolved";

export interface LineupContract {
  id: number;
  fixtureId: number;
  player: PlayerSummary;
  team: TeamSummary | null;
  teamResolution: LineupTeamResolution;
  position: string | null;
  formationPosition: number | null;
  jerseyNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

// --- Fixture Player Statistics ---

export const fixturePlayerStatsQuerySchema = paginationQuerySchema.extend({
  fixtureId: z.coerce.number().int().positive().optional(),
  playerId: z.coerce.number().int().positive().optional(),
  typeId: z.coerce.number().int().positive().optional(),
});

export type FixturePlayerStatsQuery = z.infer<typeof fixturePlayerStatsQuerySchema>;

export interface NormalizedStatValue {
  rawValue: unknown;
  normalizedValue: number | string | boolean | null;
  normalizedType: "number" | "string" | "boolean" | "null";
}

export interface FixturePlayerStatContract {
  id: number;
  sportmonksId: number | null;
  fixtureId: number;
  player: PlayerSummary;
  typeId: number | null;
  statType: StatTypeSummary | null;
  value: NormalizedStatValue;
  createdAt: string;
  updatedAt: string;
}

// --- Fixture Team Statistics ---

export const fixtureTeamStatsQuerySchema = paginationQuerySchema.extend({
  fixtureId: z.coerce.number().int().positive().optional(),
  teamId: z.coerce.number().int().positive().optional(),
  typeId: z.coerce.number().int().positive().optional(),
});

export type FixtureTeamStatsQuery = z.infer<typeof fixtureTeamStatsQuerySchema>;

export interface FixtureTeamStatContract {
  id: number;
  sportmonksId: number | null;
  fixtureId: number;
  team: TeamSummary | null;
  typeId: number | null;
  statType: StatTypeSummary | null;
  value: NormalizedStatValue;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

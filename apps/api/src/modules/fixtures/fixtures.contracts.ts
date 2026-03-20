import { z } from "zod";
import { paginationQuerySchema } from "../../contracts/pagination.js";
import type { SeasonSummary, StageSummary, RoundSummary, GroupSummary } from "../competition/competition.contracts.js";
import type { VenueSummary } from "../venues/venues.contracts.js";
import type { TeamSummary } from "../teams/teams.contracts.js";
import type { RefereeSummary } from "../referees/referees.contracts.js";
import type { FixtureStateSummary } from "../fixture-states/fixture-states.contracts.js";

export const fixturesQuerySchema = paginationQuerySchema.extend({
  seasonId: z.coerce.number().int().positive().optional(),
  stageId: z.coerce.number().int().positive().optional(),
  roundId: z.coerce.number().int().positive().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  teamId: z.coerce.number().int().positive().optional(),
  refereeId: z.coerce.number().int().positive().optional(),
  venueId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(["kickoffAt", "id"]).default("kickoffAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type FixturesQuery = z.infer<typeof fixturesQuerySchema>;

export const fixtureIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export interface FixtureContract {
  id: number;
  sportmonksId: number;
  name: string | null;
  kickoffAt: string | null;
  resultInfo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  stateId: number | null;
  state: FixtureStateSummary | null;
  season: SeasonSummary;
  stage: StageSummary | null;
  round: RoundSummary | null;
  group: GroupSummary | null;
  venue: VenueSummary | null;
  referee: RefereeSummary | null;
  homeTeam: TeamSummary | null;
  awayTeam: TeamSummary | null;
  createdAt: string;
  updatedAt: string;
}

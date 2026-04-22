import type { Fixture, Season, Stage, Round, Group, Venue, Referee, Team, FixtureState } from "db";
import {
  toSeasonSummary,
  toStageSummary,
  toRoundSummary,
  toGroupSummary,
} from "../competition/competition.mapper.js";
import { toVenueSummary } from "../venues/venues.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toRefereeSummary } from "../referees/referees.mapper.js";
import { toFixtureStateSummary } from "../fixture-states/fixture-states.mapper.js";
import type { FixtureContract } from "./fixtures.contracts.js";
type FixtureWithRelations = Fixture & {
  season: Season;
  stage: Stage | null;
  round: Round | null;
  group: Group | null;
  venue: Venue | null;
  referee: Referee | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
};
export const toFixtureContract = (
  fixture: FixtureWithRelations,
  resolvedState: FixtureState | null
): FixtureContract => {
  return {
    id: fixture.id,
    sportmonksId: fixture.sportmonksId,
    name: fixture.name,
    kickoffAt: fixture.kickoffAt?.toISOString() ?? null,
    resultInfo: fixture.resultInfo,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    homeFormation: fixture.homeFormation ?? null,
    awayFormation: fixture.awayFormation ?? null,
    stateId: fixture.stateId,
    state: resolvedState ? toFixtureStateSummary(resolvedState) : null,
    season: toSeasonSummary(fixture.season),
    stage: fixture.stage ? toStageSummary(fixture.stage) : null,
    round: fixture.round ? toRoundSummary(fixture.round) : null,
    group: fixture.group ? toGroupSummary(fixture.group) : null,
    venue: fixture.venue ? toVenueSummary(fixture.venue) : null,
    referee: fixture.referee ? toRefereeSummary(fixture.referee) : null,
    homeTeam: fixture.homeTeam ? toTeamSummary(fixture.homeTeam) : null,
    awayTeam: fixture.awayTeam ? toTeamSummary(fixture.awayTeam) : null,
    createdAt: fixture.createdAt.toISOString(),
    updatedAt: fixture.updatedAt.toISOString(),
  };
};

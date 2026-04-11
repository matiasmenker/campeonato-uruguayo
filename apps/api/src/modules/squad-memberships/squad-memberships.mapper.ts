import type { SquadMembership, Player, Team, Season } from "db";
import { toPlayerSummary } from "../players/players.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toSeasonSummary } from "../competition/competition.mapper.js";
import type { SquadMembershipContract } from "./squad-memberships.contracts.js";
type SquadMembershipWithRelations = SquadMembership & {
  player: Player;
  team: Team;
  season: Season;
};
export const toSquadMembershipContract = (
  membership: SquadMembershipWithRelations
): SquadMembershipContract => {
  return {
    id: membership.id,
    player: toPlayerSummary(membership.player),
    team: toTeamSummary(membership.team),
    season: toSeasonSummary(membership.season),
    positionId: membership.positionId,
    detailedPositionId: membership.detailedPositionId,
    from: membership.from.toISOString(),
    to: membership.to?.toISOString() ?? null,
    shirtNumber: membership.shirtNumber,
    isLoan: membership.isLoan,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
};

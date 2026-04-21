import type { SquadMembership, Player, Team, Season, Country } from "db";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toSeasonSummary } from "../competition/competition.mapper.js";
import type { SquadMembershipContract, SquadPlayerSummary } from "./squad-memberships.contracts.js";

type SquadMembershipWithRelations = SquadMembership & {
  player: Player & { country: Country | null };
  team: Team;
  season: Season;
};

const toSquadPlayerSummary = (player: Player & { country: Country | null }): SquadPlayerSummary => ({
  id: player.id,
  name: player.name,
  displayName: player.displayName,
  imagePath: player.imagePath,
  positionId: player.positionId,
  dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
  height: player.height,
  nationality: player.country
    ? { name: player.country.name, imageUrl: player.country.imageUrl }
    : null,
});

export const toSquadMembershipContract = (
  membership: SquadMembershipWithRelations
): SquadMembershipContract => {
  return {
    id: membership.id,
    player: toSquadPlayerSummary(membership.player),
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

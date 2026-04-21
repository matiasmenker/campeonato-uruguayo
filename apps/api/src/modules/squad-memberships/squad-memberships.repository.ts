import type { SquadMembership, Player, Team, Season, Country, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { SquadMembershipsQuery } from "./squad-memberships.contracts.js";
type SquadMembershipWithRelations = SquadMembership & {
  player: Player & { country: Country | null };
  team: Team;
  season: Season;
};
const includeRelations = {
  player: { include: { country: true } },
  team: true,
  season: true,
} as const;
export const findSquadMemberships = async (
  query: SquadMembershipsQuery
): Promise<{
  memberships: SquadMembershipWithRelations[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.SquadMembershipWhereInput = {};
  if (query.teamId) where.teamId = query.teamId;
  if (query.playerId) where.playerId = query.playerId;
  if (query.seasonId) where.seasonId = query.seasonId;
  const [memberships, totalItems] = await Promise.all([
    prisma.squadMembership.findMany({
      where,
      include: includeRelations,
      orderBy: [{ seasonId: "desc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.squadMembership.count({ where }),
  ]);
  return { memberships, totalItems };
};
export const findSquadMembershipById = async (
  id: number
): Promise<SquadMembershipWithRelations | null> => {
  const prisma = getPrisma();
  return prisma.squadMembership.findUnique({
    where: { id },
    include: includeRelations,
  });
};
export const findTeamSquad = async (
  teamId: number,
  seasonId: number
): Promise<SquadMembershipWithRelations[]> => {
  const prisma = getPrisma();
  return prisma.squadMembership.findMany({
    where: { teamId, seasonId },
    include: includeRelations,
    orderBy: { shirtNumber: "asc" },
  });
};
export const findCurrentSeasonId = async (): Promise<number | null> => {
  const prisma = getPrisma();
  const currentSeason = await prisma.season.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  return currentSeason?.id ?? null;
};

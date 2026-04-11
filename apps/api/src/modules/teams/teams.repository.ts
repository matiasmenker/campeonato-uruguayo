import type { Team, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { TeamsQuery } from "./teams.contracts.js";
export const findTeams = async (
  query: TeamsQuery
): Promise<{
  teams: Team[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.TeamWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "Team"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
         OR unaccent("shortCode") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  const [teams, totalItems] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.team.count({ where }),
  ]);
  return { teams, totalItems };
};
export const findTeamById = async (id: number): Promise<Team | null> => {
  const prisma = getPrisma();
  return prisma.team.findUnique({ where: { id } });
};

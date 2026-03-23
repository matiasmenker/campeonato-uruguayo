import type { Coach, Team, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { CoachesQuery } from "./coaches.contracts.js";

export async function findCoaches(
  query: CoachesQuery,
): Promise<{ coaches: Coach[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.CoachWhereInput = {};

  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Coach"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }

  if (query.teamId) {
    where.teamId = query.teamId;
  }

  const [coaches, totalItems] = await Promise.all([
    prisma.coach.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.coach.count({ where }),
  ]);

  return { coaches, totalItems };
}

export async function findCoachById(id: number): Promise<Coach | null> {
  const prisma = getPrisma();
  return prisma.coach.findUnique({ where: { id } });
}

export async function findCoachesByTeamId(teamId: number): Promise<Coach[]> {
  const prisma = getPrisma();
  return prisma.coach.findMany({
    where: { teamId },
    orderBy: { name: "asc" },
  });
}

export async function findTeamsByIds(teamIds: number[]): Promise<Map<number, Team>> {
  if (teamIds.length === 0) return new Map();
  const prisma = getPrisma();
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
  });
  return new Map(teams.map((team) => [team.id, team]));
}

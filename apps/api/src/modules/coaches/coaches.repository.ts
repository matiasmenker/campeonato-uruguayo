import type { Coach, CoachAssignment, Team, Season, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { CoachesQuery } from "./coaches.contracts.js";
type CoachWithAssignments = Coach & {
  assignments: (CoachAssignment & {
    team: Team;
    season: Season;
  })[];
};
const assignmentsInclude = {
  assignments: {
    include: { team: true, season: true },
    orderBy: { season: { startingAt: "desc" as const } },
  },
};
export const findCoaches = async (
  query: CoachesQuery
): Promise<{
  coaches: CoachWithAssignments[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.CoachWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "Coach"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  if (query.teamId || query.seasonId) {
    const assignmentFilter: Prisma.CoachAssignmentWhereInput = {};
    if (query.teamId) assignmentFilter.teamId = query.teamId;
    if (query.seasonId) assignmentFilter.seasonId = query.seasonId;
    where.assignments = { some: assignmentFilter };
  }
  const [coaches, totalItems] = await Promise.all([
    prisma.coach.findMany({
      where,
      include: assignmentsInclude,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.coach.count({ where }),
  ]);
  return { coaches, totalItems };
};
export const findCoachById = async (id: number): Promise<CoachWithAssignments | null> => {
  const prisma = getPrisma();
  return prisma.coach.findUnique({
    where: { id },
    include: assignmentsInclude,
  });
};
export const findCoachesByTeamId = async (teamId: number): Promise<CoachWithAssignments[]> => {
  const prisma = getPrisma();
  return prisma.coach.findMany({
    where: { assignments: { some: { teamId } } },
    include: assignmentsInclude,
    orderBy: { name: "asc" },
  });
};

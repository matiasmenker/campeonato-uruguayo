import type { Referee, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { RefereesQuery } from "./referees.contracts.js";
export const findReferees = async (
  query: RefereesQuery
): Promise<{
  referees: Referee[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.RefereeWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "Referee"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  const [referees, totalItems] = await Promise.all([
    prisma.referee.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.referee.count({ where }),
  ]);
  return { referees, totalItems };
};
export const findRefereeById = async (id: number): Promise<Referee | null> => {
  const prisma = getPrisma();
  return prisma.referee.findUnique({ where: { id } });
};

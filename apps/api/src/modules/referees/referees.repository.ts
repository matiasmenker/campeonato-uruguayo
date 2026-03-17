import type { Referee, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { RefereesQuery } from "./referees.contracts.js";

export async function findReferees(
  query: RefereesQuery,
): Promise<{ referees: Referee[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.RefereeWhereInput = {};

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
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
}

export async function findRefereeById(id: number): Promise<Referee | null> {
  const prisma = getPrisma();
  return prisma.referee.findUnique({ where: { id } });
}

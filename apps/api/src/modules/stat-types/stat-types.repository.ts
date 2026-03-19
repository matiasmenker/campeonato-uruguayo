import type { StatType, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { StatTypesQuery } from "./stat-types.contracts.js";

export async function findStatTypes(
  query: StatTypesQuery,
): Promise<{ statTypes: StatType[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.StatTypeWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { developerName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.modelType) {
    where.modelType = query.modelType;
  }

  if (query.statGroup) {
    where.statGroup = query.statGroup;
  }

  const [statTypes, totalItems] = await Promise.all([
    prisma.statType.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.statType.count({ where }),
  ]);

  return { statTypes, totalItems };
}

export async function findStatTypeById(
  id: number,
): Promise<StatType | null> {
  const prisma = getPrisma();
  return prisma.statType.findUnique({ where: { id } });
}

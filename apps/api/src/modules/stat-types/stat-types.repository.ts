import type { StatType, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { StatTypesQuery } from "./stat-types.contracts.js";
export const findStatTypes = async (
  query: StatTypesQuery
): Promise<{
  statTypes: StatType[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.StatTypeWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "StatType"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
         OR unaccent("developerName") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
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
};
export const findStatTypeById = async (id: number): Promise<StatType | null> => {
  const prisma = getPrisma();
  return prisma.statType.findUnique({ where: { id } });
};

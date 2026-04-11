import type { FixtureState, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { FixtureStatesQuery } from "./fixture-states.contracts.js";

export async function findFixtureStates(
  query: FixtureStatesQuery
): Promise<{ fixtureStates: FixtureState[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.FixtureStateWhereInput = {};

  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "FixtureState"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
         OR unaccent("developerName") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }

  const [fixtureStates, totalItems] = await Promise.all([
    prisma.fixtureState.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixtureState.count({ where }),
  ]);

  return { fixtureStates, totalItems };
}

export async function findFixtureStateById(id: number): Promise<FixtureState | null> {
  const prisma = getPrisma();
  return prisma.fixtureState.findUnique({ where: { id } });
}

export async function findFixtureStatesByIds(ids: number[]): Promise<Map<number, FixtureState>> {
  if (ids.length === 0) return new Map();
  const prisma = getPrisma();
  const states = await prisma.fixtureState.findMany({
    where: { id: { in: ids } },
  });
  return new Map(states.map((state) => [state.id, state]));
}

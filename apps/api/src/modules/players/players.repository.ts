import type { Player, Country, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { PlayersQuery } from "./players.contracts.js";
type PlayerWithCountry = Player & {
  country: Country | null;
};
export const findPlayers = async (
  query: PlayersQuery
): Promise<{
  players: PlayerWithCountry[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.PlayerWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "Player"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
         OR unaccent("displayName") ILIKE unaccent(${pattern})
         OR unaccent("commonName") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  if (query.positionId) {
    where.positionId = query.positionId;
  }
  const [players, totalItems] = await Promise.all([
    prisma.player.findMany({
      where,
      include: { country: true },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.player.count({ where }),
  ]);
  return { players, totalItems };
};
export const findPlayerById = async (id: number): Promise<PlayerWithCountry | null> => {
  const prisma = getPrisma();
  return prisma.player.findUnique({ where: { id }, include: { country: true } });
};

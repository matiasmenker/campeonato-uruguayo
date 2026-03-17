import type { Player, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { PlayersQuery } from "./players.contracts.js";

export async function findPlayers(
  query: PlayersQuery,
): Promise<{ players: Player[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.PlayerWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { displayName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.positionId) {
    where.positionId = query.positionId;
  }

  const [players, totalItems] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.player.count({ where }),
  ]);

  return { players, totalItems };
}

export async function findPlayerById(id: number): Promise<Player | null> {
  const prisma = getPrisma();
  return prisma.player.findUnique({ where: { id } });
}

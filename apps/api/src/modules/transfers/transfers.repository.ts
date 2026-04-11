import type { Transfer, Player, Team, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { TransfersQuery } from "./transfers.contracts.js";
type TransferWithRelations = Transfer & {
  player: Player;
  fromTeam: Team | null;
  toTeam: Team | null;
};
const includeRelations = {
  player: true,
  fromTeam: true,
  toTeam: true,
} as const;
export const findTransfers = async (
  query: TransfersQuery
): Promise<{
  transfers: TransferWithRelations[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.TransferWhereInput = {};
  if (query.playerId) where.playerId = query.playerId;
  if (query.type) where.type = query.type;
  if (query.teamId) {
    where.OR = [{ fromTeamId: query.teamId }, { toTeamId: query.teamId }];
  }
  const [transfers, totalItems] = await Promise.all([
    prisma.transfer.findMany({
      where,
      include: includeRelations,
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.transfer.count({ where }),
  ]);
  return { transfers, totalItems };
};
export const findTransferById = async (id: number): Promise<TransferWithRelations | null> => {
  const prisma = getPrisma();
  return prisma.transfer.findUnique({
    where: { id },
    include: includeRelations,
  });
};

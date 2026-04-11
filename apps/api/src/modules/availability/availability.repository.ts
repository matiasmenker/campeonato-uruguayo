import type { PlayerMarketValue, Injury, Suspension, Player, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type {
  MarketValuesQuery,
  InjuriesQuery,
  SuspensionsQuery,
} from "./availability.contracts.js";
type MarketValueWithPlayer = PlayerMarketValue & {
  player: Player;
};
export const findMarketValues = async (
  query: MarketValuesQuery
): Promise<{
  marketValues: MarketValueWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.PlayerMarketValueWhereInput = {};
  if (query.playerId) where.playerId = query.playerId;
  const [marketValues, totalItems] = await Promise.all([
    prisma.playerMarketValue.findMany({
      where,
      include: { player: true },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.playerMarketValue.count({ where }),
  ]);
  return { marketValues, totalItems };
};
export const findMarketValuesByPlayerId = async (
  playerId: number,
  query: MarketValuesQuery
): Promise<{
  marketValues: MarketValueWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.PlayerMarketValueWhereInput = { playerId };
  const [marketValues, totalItems] = await Promise.all([
    prisma.playerMarketValue.findMany({
      where,
      include: { player: true },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.playerMarketValue.count({ where }),
  ]);
  return { marketValues, totalItems };
};
type InjuryWithPlayer = Injury & {
  player: Player;
};
export const findInjuries = async (
  query: InjuriesQuery
): Promise<{
  injuries: InjuryWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.InjuryWhereInput = {};
  if (query.playerId) where.playerId = query.playerId;
  const [injuries, totalItems] = await Promise.all([
    prisma.injury.findMany({
      where,
      include: { player: true },
      orderBy: { startDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.injury.count({ where }),
  ]);
  return { injuries, totalItems };
};
export const findInjuriesByPlayerId = async (
  playerId: number,
  query: InjuriesQuery
): Promise<{
  injuries: InjuryWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.InjuryWhereInput = { playerId };
  const [injuries, totalItems] = await Promise.all([
    prisma.injury.findMany({
      where,
      include: { player: true },
      orderBy: { startDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.injury.count({ where }),
  ]);
  return { injuries, totalItems };
};
type SuspensionWithPlayer = Suspension & {
  player: Player;
};
export const findSuspensions = async (
  query: SuspensionsQuery
): Promise<{
  suspensions: SuspensionWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.SuspensionWhereInput = {};
  if (query.playerId) where.playerId = query.playerId;
  const [suspensions, totalItems] = await Promise.all([
    prisma.suspension.findMany({
      where,
      include: { player: true },
      orderBy: { startDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.suspension.count({ where }),
  ]);
  return { suspensions, totalItems };
};
export const findSuspensionsByPlayerId = async (
  playerId: number,
  query: SuspensionsQuery
): Promise<{
  suspensions: SuspensionWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.SuspensionWhereInput = { playerId };
  const [suspensions, totalItems] = await Promise.all([
    prisma.suspension.findMany({
      where,
      include: { player: true },
      orderBy: { startDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.suspension.count({ where }),
  ]);
  return { suspensions, totalItems };
};

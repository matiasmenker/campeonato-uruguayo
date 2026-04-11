import type { Standing, Season, Stage, Team, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { StandingsQuery } from "./standings.contracts.js";
type StandingWithRelations = Standing & {
  season: Season;
  stage: Stage | null;
  team: Team;
};
const includeRelations = {
  season: true,
  stage: true,
  team: true,
} as const;
export const findStandings = async (
  query: StandingsQuery
): Promise<{
  standings: StandingWithRelations[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.StandingWhereInput = {};
  if (query.seasonId) where.seasonId = query.seasonId;
  if (query.stageId) where.stageId = query.stageId;
  if (query.teamId) where.teamId = query.teamId;
  const [standings, totalItems] = await Promise.all([
    prisma.standing.findMany({
      where,
      include: includeRelations,
      orderBy: { position: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.standing.count({ where }),
  ]);
  return { standings, totalItems };
};
export const findStandingById = async (id: number): Promise<StandingWithRelations | null> => {
  const prisma = getPrisma();
  return prisma.standing.findUnique({
    where: { id },
    include: includeRelations,
  });
};

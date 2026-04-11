import type { League, Season, Stage, Round, Group, Country, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type {
  LeaguesQuery,
  SeasonsQuery,
  StagesQuery,
  RoundsQuery,
  GroupsQuery,
} from "./competition.contracts.js";
type LeagueWithCountry = League & {
  country: Country | null;
};
export const findLeagues = async (
  query: LeaguesQuery
): Promise<{
  leagues: LeagueWithCountry[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.LeagueWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "League"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  if (query.countryId) {
    where.countryId = query.countryId;
  }
  const [leagues, totalItems] = await Promise.all([
    prisma.league.findMany({
      where,
      include: { country: true },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.league.count({ where }),
  ]);
  return { leagues, totalItems };
};
export const findLeagueById = async (id: number): Promise<LeagueWithCountry | null> => {
  const prisma = getPrisma();
  return prisma.league.findUnique({
    where: { id },
    include: { country: true },
  });
};
type SeasonWithLeague = Season & {
  league: League;
};
export const findSeasons = async (
  query: SeasonsQuery
): Promise<{
  seasons: SeasonWithLeague[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.SeasonWhereInput = {};
  if (query.leagueId) {
    where.leagueId = query.leagueId;
  }
  if (query.isCurrent !== undefined) {
    where.isCurrent = query.isCurrent;
  }
  const [seasons, totalItems] = await Promise.all([
    prisma.season.findMany({
      where,
      include: { league: true },
      orderBy: { startingAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.season.count({ where }),
  ]);
  return { seasons, totalItems };
};
export const findSeasonById = async (id: number): Promise<SeasonWithLeague | null> => {
  const prisma = getPrisma();
  return prisma.season.findUnique({
    where: { id },
    include: { league: true },
  });
};
type StageWithSeason = Stage & {
  season: Season;
};
export const findStages = async (
  query: StagesQuery
): Promise<{
  stages: StageWithSeason[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.StageWhereInput = {};
  if (query.seasonId) {
    where.seasonId = query.seasonId;
  }
  const [stages, totalItems] = await Promise.all([
    prisma.stage.findMany({
      where,
      include: { season: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.stage.count({ where }),
  ]);
  return { stages, totalItems };
};
export const findStageById = async (id: number): Promise<StageWithSeason | null> => {
  const prisma = getPrisma();
  return prisma.stage.findUnique({
    where: { id },
    include: { season: true },
  });
};
type RoundWithStage = Round & {
  stage: Stage;
};
export const findRounds = async (
  query: RoundsQuery
): Promise<{
  rounds: RoundWithStage[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.RoundWhereInput = {};
  if (query.stageId) {
    where.stageId = query.stageId;
  }
  const [rounds, totalItems] = await Promise.all([
    prisma.round.findMany({
      where,
      include: { stage: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.round.count({ where }),
  ]);
  return { rounds, totalItems };
};
export const findRoundById = async (id: number): Promise<RoundWithStage | null> => {
  const prisma = getPrisma();
  return prisma.round.findUnique({
    where: { id },
    include: { stage: true },
  });
};
type GroupWithStage = Group & {
  stage: Stage;
};
export const findGroups = async (
  query: GroupsQuery
): Promise<{
  groups: GroupWithStage[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.GroupWhereInput = {};
  if (query.stageId) {
    where.stageId = query.stageId;
  }
  const [groups, totalItems] = await Promise.all([
    prisma.group.findMany({
      where,
      include: { stage: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.group.count({ where }),
  ]);
  return { groups, totalItems };
};
export const findGroupById = async (id: number): Promise<GroupWithStage | null> => {
  const prisma = getPrisma();
  return prisma.group.findUnique({
    where: { id },
    include: { stage: true },
  });
};
export const findCurrentSeason = async (): Promise<
  | (Season & {
      league: League;
      stages: (Stage & {
        rounds: Round[];
      })[];
    })
  | null
> => {
  const prisma = getPrisma();
  return prisma.season.findFirst({
    where: { isCurrent: true },
    include: {
      league: true,
      stages: {
        include: { rounds: { orderBy: { id: "asc" } } },
        orderBy: { id: "asc" },
      },
    },
  });
};

import type { Fixture, Season, Stage, Round, Group, Venue, Referee, Team, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { FixturesQuery } from "./fixtures.contracts.js";

type FixtureWithRelations = Fixture & {
  season: Season;
  stage: Stage | null;
  round: Round | null;
  group: Group | null;
  venue: Venue | null;
  referee: Referee | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

const includeRelations = {
  season: true,
  stage: true,
  round: true,
  group: true,
  venue: true,
  referee: true,
  homeTeam: true,
  awayTeam: true,
} as const;

export async function findFixtures(
  query: FixturesQuery,
): Promise<{ fixtures: FixtureWithRelations[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.FixtureWhereInput = {};

  if (query.seasonId) where.seasonId = query.seasonId;
  if (query.stageId) where.stageId = query.stageId;
  if (query.roundId) where.roundId = query.roundId;
  if (query.groupId) where.groupId = query.groupId;
  if (query.refereeId) where.refereeId = query.refereeId;
  if (query.venueId) where.venueId = query.venueId;

  if (query.teamId) {
    where.OR = [
      { homeTeamId: query.teamId },
      { awayTeamId: query.teamId },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    where.kickoffAt = {};
    if (query.dateFrom) where.kickoffAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.kickoffAt.lte = new Date(query.dateTo);
  }

  const orderBy: Prisma.FixtureOrderByWithRelationInput =
    query.sort === "kickoffAt"
      ? { kickoffAt: query.order }
      : { id: query.order };

  const [fixtures, totalItems] = await Promise.all([
    prisma.fixture.findMany({
      where,
      include: includeRelations,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixture.count({ where }),
  ]);

  return { fixtures, totalItems };
}

export async function findFixtureById(
  id: number,
): Promise<FixtureWithRelations | null> {
  const prisma = getPrisma();
  return prisma.fixture.findUnique({
    where: { id },
    include: includeRelations,
  });
}

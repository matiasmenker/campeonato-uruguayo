import type { DetailResponse } from "../../contracts/pagination.js";
import { getPrisma } from "../../database/index.js";
import { toPlayerSummary } from "../players/players.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toStatTypeSummary } from "../stat-types/stat-types.mapper.js";
import type {
  LeaderCategory,
  LeaderEntry,
  LeadersContract,
  LeadersQuery,
} from "./metrics.contracts.js";

type LeaderAggregation = "sum" | "average";

const toNumericStatValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const buildLeaderCategory = async (
  category: string,
  developerName: string,
  seasonId: number | undefined,
  stageId: number | undefined,
  roundId: number | undefined,
  limit: number,
  aggregation: LeaderAggregation = "sum"
): Promise<LeaderCategory> => {
  const prisma = getPrisma();
  const statType = await prisma.statType.findFirst({
    where: { developerName },
  });

  if (!statType) {
    return { category, statType: null, leaders: [] };
  }

  const whereFixture: Record<string, unknown> = {};

  if (seasonId) {
    whereFixture.seasonId = seasonId;
  }

  if (stageId) {
    whereFixture.stageId = stageId;
  }

  if (roundId) {
    whereFixture.roundId = roundId;
  }

  const stats = await prisma.fixturePlayerStatistic.findMany({
    where: {
      typeId: statType.id,
      fixture: whereFixture,
    },
    include: {
      player: true,
      fixture: {
        select: { seasonId: true },
      },
    },
  });

  const playerTotals = new Map<
    number,
    {
      player: (typeof stats)[number]["player"];
      total: number;
      appearances: number;
    }
  >();

  for (const stat of stats) {
    const numericValue = toNumericStatValue(stat.value);

    if (numericValue === null) continue;

    const existing = playerTotals.get(stat.playerId);

    if (existing) {
      existing.total += numericValue;
      existing.appearances += 1;
      continue;
    }

    playerTotals.set(stat.playerId, {
      player: stat.player,
      total: numericValue,
      appearances: 1,
    });
  }

  const getAggregateValue = (entry: { total: number; appearances: number }) => {
    if (aggregation === "average") {
      return entry.appearances > 0 ? entry.total / entry.appearances : 0;
    }

    return entry.total;
  };

  const sorted = [...playerTotals.values()]
    .sort((left, right) => getAggregateValue(right) - getAggregateValue(left))
    .slice(0, limit);

  const playerIds = sorted.map((entry) => entry.player.id);

  const currentSeasonId =
    seasonId ??
    (
      await prisma.season.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      })
    )?.id;

  const squadMemberships =
    currentSeasonId && playerIds.length > 0
      ? await prisma.squadMembership.findMany({
          where: {
            playerId: { in: playerIds },
            seasonId: currentSeasonId,
          },
          include: { team: true },
        })
      : [];

  const playerTeamMap = new Map(
    squadMemberships.map((membership) => [membership.playerId, membership.team])
  );

  const leaders: LeaderEntry[] = sorted.map((entry) => ({
    player: toPlayerSummary(entry.player),
    team: playerTeamMap.get(entry.player.id)
      ? toTeamSummary(playerTeamMap.get(entry.player.id)!)
      : null,
    value:
      aggregation === "average"
        ? Number(getAggregateValue(entry).toFixed(2))
        : getAggregateValue(entry),
  }));

  return {
    category,
    statType: toStatTypeSummary(statType),
    leaders,
  };
};

export const getLeaders = async (query: LeadersQuery): Promise<DetailResponse<LeadersContract>> => {
  const [topRated, topScorers, topAssists, topYellowCards, topRedCards] = await Promise.all([
    buildLeaderCategory("topRated", "RATING", query.seasonId, query.stageId, query.roundId, query.limit, "average"),
    buildLeaderCategory("topScorers", "GOALS", query.seasonId, query.stageId, query.roundId, query.limit),
    buildLeaderCategory("topAssists", "ASSISTS", query.seasonId, query.stageId, query.roundId, query.limit),
    buildLeaderCategory("topYellowCards", "YELLOWCARDS", query.seasonId, query.stageId, query.roundId, query.limit),
    buildLeaderCategory("topRedCards", "REDCARDS", query.seasonId, query.stageId, query.roundId, query.limit),
  ]);

  return {
    data: {
      topRated,
      topScorers,
      topAssists,
      topYellowCards,
      topRedCards,
    },
  };
};

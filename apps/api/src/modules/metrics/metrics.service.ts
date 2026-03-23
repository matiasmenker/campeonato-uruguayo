import type { DetailResponse } from "../../contracts/pagination.js";
import { getPrisma } from "../../database/index.js";
import { toPlayerSummary } from "../players/players.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toStatTypeSummary } from "../stat-types/stat-types.mapper.js";
import type { LeadersQuery, LeadersContract, LeaderCategory, LeaderEntry } from "./metrics.contracts.js";

async function buildLeaderCategory(
  category: string,
  developerName: string,
  seasonId: number | undefined,
  limit: number,
): Promise<LeaderCategory> {
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

  const playerTotals = new Map<number, { player: typeof stats[number]["player"]; total: number }>();

  for (const stat of stats) {
    let numericValue = 0;
    if (typeof stat.value === "number") {
      numericValue = stat.value;
    } else if (typeof stat.value === "string") {
      const parsed = Number(stat.value);
      if (!Number.isNaN(parsed)) numericValue = parsed;
    }

    const existing = playerTotals.get(stat.playerId);
    if (existing) {
      existing.total += numericValue;
    } else {
      playerTotals.set(stat.playerId, { player: stat.player, total: numericValue });
    }
  }

  const sorted = [...playerTotals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const playerIds = sorted.map((entry) => entry.player.id);
  const currentSeasonId = seasonId ?? (await prisma.season.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  }))?.id;

  const squadMemberships = currentSeasonId
    ? await prisma.squadMembership.findMany({
        where: {
          playerId: { in: playerIds },
          seasonId: currentSeasonId,
        },
        include: { team: true },
      })
    : [];

  const playerTeamMap = new Map(
    squadMemberships.map((membership) => [membership.playerId, membership.team]),
  );

  const leaders: LeaderEntry[] = sorted.map((entry) => ({
    player: toPlayerSummary(entry.player),
    team: playerTeamMap.get(entry.player.id)
      ? toTeamSummary(playerTeamMap.get(entry.player.id)!)
      : null,
    value: entry.total,
  }));

  return {
    category,
    statType: toStatTypeSummary(statType),
    leaders,
  };
}

export async function getLeaders(
  query: LeadersQuery,
): Promise<DetailResponse<LeadersContract>> {
  const [topScorers, topAssists, topYellowCards, topRedCards] = await Promise.all([
    buildLeaderCategory("topScorers", "goals", query.seasonId, query.limit),
    buildLeaderCategory("topAssists", "assists", query.seasonId, query.limit),
    buildLeaderCategory("topYellowCards", "yellowcards", query.seasonId, query.limit),
    buildLeaderCategory("topRedCards", "redcards", query.seasonId, query.limit),
  ]);

  return {
    data: {
      topScorers,
      topAssists,
      topYellowCards,
      topRedCards,
    },
  };
}

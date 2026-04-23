import type {
  FixtureChangeLog,
  Event,
  Lineup,
  FixturePlayerStatistic,
  FixtureTeamStatistic,
  Player,
  Team,
  Prisma,
} from "db";
import { getPrisma } from "../../database/index.js";
import type {
  ChangeLogsQuery,
  EventsQuery,
  LineupsQuery,
  FixturePlayerStatsQuery,
  FixtureTeamStatsQuery,
} from "./fixture-details.contracts.js";
export const findChangeLogs = async (
  query: ChangeLogsQuery
): Promise<{
  changeLogs: FixtureChangeLog[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.FixtureChangeLogWhereInput = {};
  if (query.fixtureId) where.fixtureId = query.fixtureId;
  const [changeLogs, totalItems] = await Promise.all([
    prisma.fixtureChangeLog.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixtureChangeLog.count({ where }),
  ]);
  return { changeLogs, totalItems };
};
export const findChangeLogsByFixtureId = async (
  fixtureId: number,
  query: ChangeLogsQuery
): Promise<{
  changeLogs: FixtureChangeLog[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.FixtureChangeLogWhereInput = { fixtureId };
  const [changeLogs, totalItems] = await Promise.all([
    prisma.fixtureChangeLog.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixtureChangeLog.count({ where }),
  ]);
  return { changeLogs, totalItems };
};
type EventWithPlayer = Event & {
  player: Player | null;
  relatedPlayer: Player | null;
};
export const findEvents = async (
  query: EventsQuery
): Promise<{
  events: EventWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.EventWhereInput = {};
  if (query.fixtureId) where.fixtureId = query.fixtureId;
  if (query.playerId) where.playerId = query.playerId;
  if (query.typeId) where.typeId = query.typeId;
  if (query.seasonId || query.stageId) {
    const fixtureWhere: Record<string, unknown> = {};
    if (query.seasonId) fixtureWhere.seasonId = query.seasonId;
    if (query.stageId) fixtureWhere.stageId = query.stageId;
    where.fixture = fixtureWhere;
  }
  const [events, totalItems] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { player: true, relatedPlayer: true },
      orderBy: [{ sortOrder: "asc" }, { minute: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.event.count({ where }),
  ]);
  return { events, totalItems };
};
export const findEventsByFixtureId = async (
  fixtureId: number,
  query: EventsQuery
): Promise<{
  events: EventWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.EventWhereInput = { fixtureId };
  if (query.playerId) where.playerId = query.playerId;
  if (query.typeId) where.typeId = query.typeId;
  const [events, totalItems] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { player: true, relatedPlayer: true },
      orderBy: [{ sortOrder: "asc" }, { minute: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.event.count({ where }),
  ]);
  return { events, totalItems };
};
type LineupWithPlayer = Lineup & {
  player: Player;
};
export const findLineups = async (
  query: LineupsQuery
): Promise<{
  lineups: LineupWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.LineupWhereInput = {};
  if (query.fixtureId) where.fixtureId = query.fixtureId;
  if (query.playerId) where.playerId = query.playerId;
  const [lineups, totalItems] = await Promise.all([
    prisma.lineup.findMany({
      where,
      include: { player: true },
      orderBy: [{ formationPosition: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.lineup.count({ where }),
  ]);
  return { lineups, totalItems };
};
export const findLineupsByFixtureId = async (
  fixtureId: number,
  query: LineupsQuery
): Promise<{
  lineups: LineupWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.LineupWhereInput = { fixtureId };
  if (query.playerId) where.playerId = query.playerId;
  const [lineups, totalItems] = await Promise.all([
    prisma.lineup.findMany({
      where,
      include: { player: true },
      orderBy: [{ formationPosition: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.lineup.count({ where }),
  ]);
  return { lineups, totalItems };
};
export const resolveLineupTeams = async (
  lineups: LineupWithPlayer[]
): Promise<Map<number, Team>> => {
  if (lineups.length === 0) return new Map();
  const prisma = getPrisma();
  const playerIds = [...new Set(lineups.map((lineup) => lineup.playerId))];
  const fixtureIds = [...new Set(lineups.map((lineup) => lineup.fixtureId))];
  const fixtures = await prisma.fixture.findMany({
    where: { id: { in: fixtureIds } },
    select: { id: true, seasonId: true, homeTeamId: true, awayTeamId: true },
  });
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const seasonIds = [...new Set(fixtures.map((fixture) => fixture.seasonId))];
  const teamIds = fixtures.flatMap((fixture) =>
    [fixture.homeTeamId, fixture.awayTeamId].filter((id): id is number => id !== null)
  );
  const [squads, teams] = await Promise.all([
    prisma.squadMembership.findMany({
      where: {
        playerId: { in: playerIds },
        seasonId: { in: seasonIds },
        teamId: { in: teamIds },
      },
      select: { playerId: true, teamId: true, seasonId: true },
    }),
    prisma.team.findMany({
      where: { id: { in: teamIds } },
    }),
  ]);
  const teamsMap = new Map(teams.map((team) => [team.id, team]));
  // Build playerId:seasonId → Set<teamId> to handle loan players with multiple memberships.
  const playerSeasonTeamsMap = new Map<string, Set<number>>();
  const playerSeasonKey = (playerId: number, seasonId: number) => `${playerId}:${seasonId}`;
  for (const squad of squads) {
    const key = playerSeasonKey(squad.playerId, squad.seasonId);
    const existing = playerSeasonTeamsMap.get(key) ?? new Set<number>();
    existing.add(squad.teamId);
    playerSeasonTeamsMap.set(key, existing);
  }
  const result = new Map<number, Team>();
  for (const lineup of lineups) {
    const fixture = fixtureMap.get(lineup.fixtureId);
    if (!fixture) continue;
    const key = playerSeasonKey(lineup.playerId, fixture.seasonId);
    const playerTeamIds = playerSeasonTeamsMap.get(key);
    if (!playerTeamIds) continue;
    const fixtureTeamIds = [fixture.homeTeamId, fixture.awayTeamId].filter(
      (id): id is number => id !== null
    );
    // Prefer the team that actually played in this fixture (handles loan players).
    const matchingTeamId = fixtureTeamIds.find((id) => playerTeamIds.has(id));
    const resolvedTeamId = matchingTeamId ?? playerTeamIds.values().next().value;
    if (resolvedTeamId !== undefined) {
      const team = teamsMap.get(resolvedTeamId);
      if (team) result.set(lineup.id, team);
    }
  }
  return result;
};
type PlayerStatWithPlayer = FixturePlayerStatistic & {
  player: Player;
};
export const findFixturePlayerStats = async (
  query: FixturePlayerStatsQuery
): Promise<{
  stats: PlayerStatWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.FixturePlayerStatisticWhereInput = {};
  if (query.fixtureId) where.fixtureId = query.fixtureId;
  if (query.playerId) where.playerId = query.playerId;
  if (query.typeId) where.typeId = query.typeId;
  if (query.seasonId || query.stageId) {
    const fixtureWhere: Record<string, unknown> = {};
    if (query.seasonId) fixtureWhere.seasonId = query.seasonId;
    if (query.stageId) fixtureWhere.stageId = query.stageId;
    where.fixture = fixtureWhere;
  }
  const [stats, totalItems] = await Promise.all([
    prisma.fixturePlayerStatistic.findMany({
      where,
      include: { player: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixturePlayerStatistic.count({ where }),
  ]);
  return { stats, totalItems };
};
export const findFixturePlayerStatsByFixtureId = async (
  fixtureId: number,
  query: FixturePlayerStatsQuery
): Promise<{
  stats: PlayerStatWithPlayer[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.FixturePlayerStatisticWhereInput = { fixtureId };
  if (query.playerId) where.playerId = query.playerId;
  if (query.typeId) where.typeId = query.typeId;
  const [stats, totalItems] = await Promise.all([
    prisma.fixturePlayerStatistic.findMany({
      where,
      include: { player: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixturePlayerStatistic.count({ where }),
  ]);
  return { stats, totalItems };
};
type TeamStatWithTeam = FixtureTeamStatistic & {
  team: Team | null;
};
export const findFixtureTeamStats = async (
  query: FixtureTeamStatsQuery
): Promise<{
  stats: TeamStatWithTeam[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.FixtureTeamStatisticWhereInput = {};
  if (query.fixtureId) where.fixtureId = query.fixtureId;
  if (query.teamId) where.teamId = query.teamId;
  if (query.typeId) where.typeId = query.typeId;
  const [stats, totalItems] = await Promise.all([
    prisma.fixtureTeamStatistic.findMany({
      where,
      include: { team: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixtureTeamStatistic.count({ where }),
  ]);
  return { stats, totalItems };
};
export const findFixtureTeamStatsByFixtureId = async (
  fixtureId: number,
  query: FixtureTeamStatsQuery
): Promise<{
  stats: TeamStatWithTeam[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.FixtureTeamStatisticWhereInput = { fixtureId };
  if (query.teamId) where.teamId = query.teamId;
  if (query.typeId) where.typeId = query.typeId;
  const [stats, totalItems] = await Promise.all([
    prisma.fixtureTeamStatistic.findMany({
      where,
      include: { team: true },
      orderBy: { id: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.fixtureTeamStatistic.count({ where }),
  ]);
  return { stats, totalItems };
};

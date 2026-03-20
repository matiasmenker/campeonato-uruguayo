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

// --- Change Logs ---

export async function findChangeLogs(
  query: ChangeLogsQuery,
): Promise<{ changeLogs: FixtureChangeLog[]; totalItems: number }> {
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
}

export async function findChangeLogsByFixtureId(
  fixtureId: number,
  query: ChangeLogsQuery,
): Promise<{ changeLogs: FixtureChangeLog[]; totalItems: number }> {
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
}

// --- Events ---

type EventWithPlayer = Event & { player: Player | null };

export async function findEvents(
  query: EventsQuery,
): Promise<{ events: EventWithPlayer[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.EventWhereInput = {};

  if (query.fixtureId) where.fixtureId = query.fixtureId;
  if (query.playerId) where.playerId = query.playerId;
  if (query.typeId) where.typeId = query.typeId;

  const [events, totalItems] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { player: true },
      orderBy: [{ sortOrder: "asc" }, { minute: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, totalItems };
}

export async function findEventsByFixtureId(
  fixtureId: number,
  query: EventsQuery,
): Promise<{ events: EventWithPlayer[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.EventWhereInput = { fixtureId };

  if (query.playerId) where.playerId = query.playerId;
  if (query.typeId) where.typeId = query.typeId;

  const [events, totalItems] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { player: true },
      orderBy: [{ sortOrder: "asc" }, { minute: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, totalItems };
}

// --- Lineups ---

type LineupWithPlayer = Lineup & { player: Player };

export async function findLineups(
  query: LineupsQuery,
): Promise<{ lineups: LineupWithPlayer[]; totalItems: number }> {
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
}

export async function findLineupsByFixtureId(
  fixtureId: number,
  query: LineupsQuery,
): Promise<{ lineups: LineupWithPlayer[]; totalItems: number }> {
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
}

// --- Resolve lineup team via squad membership ---

export async function resolveLineupTeams(
  lineups: LineupWithPlayer[],
): Promise<Map<number, Team>> {
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
    [fixture.homeTeamId, fixture.awayTeamId].filter((id): id is number => id !== null),
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
  const squadKey = (playerId: number, seasonId: number) => `${playerId}:${seasonId}`;
  const squadTeamMap = new Map<string, number>();
  for (const squad of squads) {
    squadTeamMap.set(squadKey(squad.playerId, squad.seasonId), squad.teamId);
  }

  const result = new Map<number, Team>();
  for (const lineup of lineups) {
    const fixture = fixtureMap.get(lineup.fixtureId);
    if (!fixture) continue;

    const resolvedTeamId = squadTeamMap.get(
      squadKey(lineup.playerId, fixture.seasonId),
    );
    if (resolvedTeamId) {
      const team = teamsMap.get(resolvedTeamId);
      if (team) result.set(lineup.id, team);
    }
  }

  return result;
}

// --- Fixture Player Statistics ---

type PlayerStatWithPlayer = FixturePlayerStatistic & { player: Player };

export async function findFixturePlayerStats(
  query: FixturePlayerStatsQuery,
): Promise<{ stats: PlayerStatWithPlayer[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.FixturePlayerStatisticWhereInput = {};

  if (query.fixtureId) where.fixtureId = query.fixtureId;
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
}

export async function findFixturePlayerStatsByFixtureId(
  fixtureId: number,
  query: FixturePlayerStatsQuery,
): Promise<{ stats: PlayerStatWithPlayer[]; totalItems: number }> {
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
}

// --- Fixture Team Statistics ---

type TeamStatWithTeam = FixtureTeamStatistic & { team: Team | null };

export async function findFixtureTeamStats(
  query: FixtureTeamStatsQuery,
): Promise<{ stats: TeamStatWithTeam[]; totalItems: number }> {
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
}

export async function findFixtureTeamStatsByFixtureId(
  fixtureId: number,
  query: FixtureTeamStatsQuery,
): Promise<{ stats: TeamStatWithTeam[]; totalItems: number }> {
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
}

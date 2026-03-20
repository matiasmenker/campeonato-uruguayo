import type { PaginatedResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { findFixtureStatesByIds } from "../fixture-states/fixture-states.repository.js";
import type {
  ChangeLogsQuery,
  ChangeLogContract,
  EventsQuery,
  EventContract,
  LineupsQuery,
  LineupContract,
  FixturePlayerStatsQuery,
  FixturePlayerStatContract,
  FixtureTeamStatsQuery,
  FixtureTeamStatContract,
} from "./fixture-details.contracts.js";
import {
  toChangeLogContract,
  toEventContract,
  toLineupContract,
  toFixturePlayerStatContract,
  toFixtureTeamStatContract,
} from "./fixture-details.mapper.js";
import {
  findChangeLogs,
  findChangeLogsByFixtureId,
  findEvents,
  findEventsByFixtureId,
  findLineups,
  findLineupsByFixtureId,
  resolveLineupTeams,
  findFixturePlayerStats,
  findFixturePlayerStatsByFixtureId,
  findFixtureTeamStats,
  findFixtureTeamStatsByFixtureId,
} from "./fixture-details.repository.js";
import { getPrisma } from "../../database/index.js";

// --- Stat type resolution helper ---

async function resolveStatTypes(typeIds: (number | null)[]): Promise<Map<number, import("db").StatType>> {
  const validIds = typeIds.filter((id): id is number => id !== null);
  if (validIds.length === 0) return new Map();

  const prisma = getPrisma();
  const statTypes = await prisma.statType.findMany({
    where: { id: { in: [...new Set(validIds)] } },
  });
  return new Map(statTypes.map((statType) => [statType.id, statType]));
}

// --- Change Logs ---

export async function listChangeLogs(
  query: ChangeLogsQuery,
): Promise<PaginatedResponse<ChangeLogContract>> {
  const { changeLogs, totalItems } = await findChangeLogs(query);

  const stateIds = changeLogs.flatMap((log) =>
    [log.previousStateId, log.nextStateId].filter((id): id is number => id !== null),
  );
  const statesMap = await findFixtureStatesByIds([...new Set(stateIds)]);

  return {
    data: changeLogs.map((log) =>
      toChangeLogContract(
        log,
        log.previousStateId ? statesMap.get(log.previousStateId) ?? null : null,
        log.nextStateId ? statesMap.get(log.nextStateId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listFixtureChangeLogs(
  fixtureId: number,
  query: ChangeLogsQuery,
): Promise<PaginatedResponse<ChangeLogContract>> {
  const { changeLogs, totalItems } = await findChangeLogsByFixtureId(fixtureId, query);

  const stateIds = changeLogs.flatMap((log) =>
    [log.previousStateId, log.nextStateId].filter((id): id is number => id !== null),
  );
  const statesMap = await findFixtureStatesByIds([...new Set(stateIds)]);

  return {
    data: changeLogs.map((log) =>
      toChangeLogContract(
        log,
        log.previousStateId ? statesMap.get(log.previousStateId) ?? null : null,
        log.nextStateId ? statesMap.get(log.nextStateId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

// --- Events ---

export async function listEvents(
  query: EventsQuery,
): Promise<PaginatedResponse<EventContract>> {
  const { events, totalItems } = await findEvents(query);
  return {
    data: events.map(toEventContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listFixtureEvents(
  fixtureId: number,
  query: EventsQuery,
): Promise<PaginatedResponse<EventContract>> {
  const { events, totalItems } = await findEventsByFixtureId(fixtureId, query);
  return {
    data: events.map(toEventContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

// --- Lineups ---

export async function listLineups(
  query: LineupsQuery,
): Promise<PaginatedResponse<LineupContract>> {
  const { lineups, totalItems } = await findLineups(query);
  const teamMap = await resolveLineupTeams(lineups);

  return {
    data: lineups.map((lineup) =>
      toLineupContract(lineup, teamMap.get(lineup.id) ?? null),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listFixtureLineups(
  fixtureId: number,
  query: LineupsQuery,
): Promise<PaginatedResponse<LineupContract>> {
  const { lineups, totalItems } = await findLineupsByFixtureId(fixtureId, query);
  const teamMap = await resolveLineupTeams(lineups);

  return {
    data: lineups.map((lineup) =>
      toLineupContract(lineup, teamMap.get(lineup.id) ?? null),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

// --- Fixture Player Statistics ---

export async function listFixturePlayerStats(
  query: FixturePlayerStatsQuery,
): Promise<PaginatedResponse<FixturePlayerStatContract>> {
  const { stats, totalItems } = await findFixturePlayerStats(query);
  const statTypesMap = await resolveStatTypes(stats.map((stat) => stat.typeId));

  return {
    data: stats.map((stat) =>
      toFixturePlayerStatContract(
        stat,
        stat.typeId ? statTypesMap.get(stat.typeId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listFixturePlayerStatsByFixture(
  fixtureId: number,
  query: FixturePlayerStatsQuery,
): Promise<PaginatedResponse<FixturePlayerStatContract>> {
  const { stats, totalItems } = await findFixturePlayerStatsByFixtureId(fixtureId, query);
  const statTypesMap = await resolveStatTypes(stats.map((stat) => stat.typeId));

  return {
    data: stats.map((stat) =>
      toFixturePlayerStatContract(
        stat,
        stat.typeId ? statTypesMap.get(stat.typeId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

// --- Fixture Team Statistics ---

export async function listFixtureTeamStats(
  query: FixtureTeamStatsQuery,
): Promise<PaginatedResponse<FixtureTeamStatContract>> {
  const { stats, totalItems } = await findFixtureTeamStats(query);
  const statTypesMap = await resolveStatTypes(stats.map((stat) => stat.typeId));

  return {
    data: stats.map((stat) =>
      toFixtureTeamStatContract(
        stat,
        stat.typeId ? statTypesMap.get(stat.typeId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function listFixtureTeamStatsByFixture(
  fixtureId: number,
  query: FixtureTeamStatsQuery,
): Promise<PaginatedResponse<FixtureTeamStatContract>> {
  const { stats, totalItems } = await findFixtureTeamStatsByFixtureId(fixtureId, query);
  const statTypesMap = await resolveStatTypes(stats.map((stat) => stat.typeId));

  return {
    data: stats.map((stat) =>
      toFixtureTeamStatContract(
        stat,
        stat.typeId ? statTypesMap.get(stat.typeId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

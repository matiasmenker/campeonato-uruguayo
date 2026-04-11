import type {
  FixtureChangeLog,
  Event,
  Lineup,
  FixturePlayerStatistic,
  FixtureTeamStatistic,
  Player,
  Team,
  FixtureState,
  StatType,
} from "db";
import { toPlayerSummary } from "../players/players.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import { toFixtureStateSummary } from "../fixture-states/fixture-states.mapper.js";
import { toStatTypeSummary } from "../stat-types/stat-types.mapper.js";
import type {
  ChangeLogContract,
  EventContract,
  LineupContract,
  LineupTeamResolution,
  FixturePlayerStatContract,
  FixtureTeamStatContract,
  NormalizedStatValue,
} from "./fixture-details.contracts.js";

export function normalizeStatValue(rawValue: unknown): NormalizedStatValue {
  if (rawValue === null || rawValue === undefined) {
    return { rawValue, normalizedValue: null, normalizedType: "null" };
  }

  if (typeof rawValue === "boolean") {
    return { rawValue, normalizedValue: rawValue, normalizedType: "boolean" };
  }

  if (typeof rawValue === "number") {
    return { rawValue, normalizedValue: rawValue, normalizedType: "number" };
  }

  if (typeof rawValue === "string") {
    const parsed = Number(rawValue);
    if (!Number.isNaN(parsed)) {
      return { rawValue, normalizedValue: parsed, normalizedType: "number" };
    }
    return { rawValue, normalizedValue: rawValue, normalizedType: "string" };
  }

  return {
    rawValue,
    normalizedValue: String(rawValue),
    normalizedType: "string",
  };
}

export function toChangeLogContract(
  changeLog: FixtureChangeLog,
  previousState: FixtureState | null,
  nextState: FixtureState | null
): ChangeLogContract {
  return {
    id: changeLog.id,
    fixtureId: changeLog.fixtureId,
    previousStateId: changeLog.previousStateId,
    previousState: previousState ? toFixtureStateSummary(previousState) : null,
    nextStateId: changeLog.nextStateId,
    nextState: nextState ? toFixtureStateSummary(nextState) : null,
    previousKickoffAt: changeLog.previousKickoffAt?.toISOString() ?? null,
    nextKickoffAt: changeLog.nextKickoffAt?.toISOString() ?? null,
    previousResultInfo: changeLog.previousResultInfo,
    nextResultInfo: changeLog.nextResultInfo,
    detectedAt: changeLog.detectedAt.toISOString(),
  };
}

type EventWithPlayer = Event & { player: Player | null };

export function toEventContract(event: EventWithPlayer): EventContract {
  return {
    id: event.id,
    sportmonksId: event.sportmonksId,
    fixtureId: event.fixtureId,
    player: event.player ? toPlayerSummary(event.player) : null,
    typeId: event.typeId,
    sortOrder: event.sortOrder,
    minute: event.minute,
    extraMinute: event.extraMinute,
    result: event.result,
    info: event.info,
    addition: event.addition,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

type LineupWithPlayer = Lineup & { player: Player };

export function toLineupContract(lineup: LineupWithPlayer, team: Team | null): LineupContract {
  const teamResolution: LineupTeamResolution = team ? "resolved" : "unresolved";

  return {
    id: lineup.id,
    fixtureId: lineup.fixtureId,
    player: toPlayerSummary(lineup.player),
    team: team ? toTeamSummary(team) : null,
    teamResolution,
    position: lineup.position,
    formationPosition: lineup.formationPosition,
    jerseyNumber: lineup.jerseyNumber,
    createdAt: lineup.createdAt.toISOString(),
    updatedAt: lineup.updatedAt.toISOString(),
  };
}

type PlayerStatWithPlayer = FixturePlayerStatistic & { player: Player };

export function toFixturePlayerStatContract(
  stat: PlayerStatWithPlayer,
  statType: StatType | null
): FixturePlayerStatContract {
  return {
    id: stat.id,
    sportmonksId: stat.sportmonksId,
    fixtureId: stat.fixtureId,
    player: toPlayerSummary(stat.player),
    typeId: stat.typeId,
    statType: statType ? toStatTypeSummary(statType) : null,
    value: normalizeStatValue(stat.value),
    createdAt: stat.createdAt.toISOString(),
    updatedAt: stat.updatedAt.toISOString(),
  };
}

type TeamStatWithTeam = FixtureTeamStatistic & { team: Team | null };

export function toFixtureTeamStatContract(
  stat: TeamStatWithTeam,
  statType: StatType | null
): FixtureTeamStatContract {
  return {
    id: stat.id,
    sportmonksId: stat.sportmonksId,
    fixtureId: stat.fixtureId,
    team: stat.team ? toTeamSummary(stat.team) : null,
    typeId: stat.typeId,
    statType: statType ? toStatTypeSummary(statType) : null,
    value: normalizeStatValue(stat.value),
    location: stat.location,
    createdAt: stat.createdAt.toISOString(),
    updatedAt: stat.updatedAt.toISOString(),
  };
}

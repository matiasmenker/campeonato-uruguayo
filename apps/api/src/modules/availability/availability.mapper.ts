import type { PlayerMarketValue, Injury, Suspension, Player } from "db";
import { toPlayerSummary } from "../players/players.mapper.js";
import type {
  PlayerMarketValueContract,
  InjuryContract,
  SuspensionContract,
} from "./availability.contracts.js";

type MarketValueWithPlayer = PlayerMarketValue & { player: Player };

export function toMarketValueContract(
  marketValue: MarketValueWithPlayer,
): PlayerMarketValueContract {
  return {
    id: marketValue.id,
    sportmonksId: marketValue.sportmonksId,
    player: toPlayerSummary(marketValue.player),
    value: marketValue.value.toString(),
    currency: marketValue.currency,
    date: marketValue.date?.toISOString() ?? null,
    createdAt: marketValue.createdAt.toISOString(),
    updatedAt: marketValue.updatedAt.toISOString(),
  };
}

type InjuryWithPlayer = Injury & { player: Player };

export function toInjuryContract(injury: InjuryWithPlayer): InjuryContract {
  return {
    id: injury.id,
    sportmonksId: injury.sportmonksId,
    player: toPlayerSummary(injury.player),
    type: injury.type,
    reason: injury.reason,
    startDate: injury.startDate?.toISOString() ?? null,
    expectedReturn: injury.expectedReturn?.toISOString() ?? null,
    createdAt: injury.createdAt.toISOString(),
    updatedAt: injury.updatedAt.toISOString(),
  };
}

type SuspensionWithPlayer = Suspension & { player: Player };

export function toSuspensionContract(
  suspension: SuspensionWithPlayer,
): SuspensionContract {
  return {
    id: suspension.id,
    sportmonksId: suspension.sportmonksId,
    player: toPlayerSummary(suspension.player),
    reason: suspension.reason,
    startDate: suspension.startDate?.toISOString() ?? null,
    endDate: suspension.endDate?.toISOString() ?? null,
    createdAt: suspension.createdAt.toISOString(),
    updatedAt: suspension.updatedAt.toISOString(),
  };
}

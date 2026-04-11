import type { FixtureState } from "db";
import type { FixtureStateContract, FixtureStateSummary } from "./fixture-states.contracts.js";

export function toFixtureStateContract(state: FixtureState): FixtureStateContract {
  return {
    id: state.id,
    state: state.state,
    name: state.name,
    shortName: state.shortName,
    developerName: state.developerName,
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
  };
}

export function toFixtureStateSummary(state: FixtureState): FixtureStateSummary {
  return {
    id: state.id,
    state: state.state,
    name: state.name,
    shortName: state.shortName,
    developerName: state.developerName,
  };
}

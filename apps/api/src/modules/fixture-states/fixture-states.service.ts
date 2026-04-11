import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { FixtureStatesQuery, FixtureStateContract } from "./fixture-states.contracts.js";
import { toFixtureStateContract } from "./fixture-states.mapper.js";
import { findFixtureStates, findFixtureStateById } from "./fixture-states.repository.js";
export const listFixtureStates = async (
  query: FixtureStatesQuery
): Promise<PaginatedResponse<FixtureStateContract>> => {
  const { fixtureStates, totalItems } = await findFixtureStates(query);
  return {
    data: fixtureStates.map(toFixtureStateContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getFixtureState = async (
  id: number
): Promise<DetailResponse<FixtureStateContract>> => {
  const fixtureState = await findFixtureStateById(id);
  if (!fixtureState) throw new NotFoundError("Fixture state");
  return { data: toFixtureStateContract(fixtureState) };
};

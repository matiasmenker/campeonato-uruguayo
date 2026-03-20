import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import { findFixtureStatesByIds } from "../fixture-states/fixture-states.repository.js";
import type { FixturesQuery, FixtureContract } from "./fixtures.contracts.js";
import { toFixtureContract } from "./fixtures.mapper.js";
import { findFixtures, findFixtureById } from "./fixtures.repository.js";

export async function listFixtures(
  query: FixturesQuery,
): Promise<PaginatedResponse<FixtureContract>> {
  const { fixtures, totalItems } = await findFixtures(query);

  const stateIds = fixtures
    .map((fixture) => fixture.stateId)
    .filter((id): id is number => id !== null);
  const statesMap = await findFixtureStatesByIds([...new Set(stateIds)]);

  return {
    data: fixtures.map((fixture) =>
      toFixtureContract(
        fixture,
        fixture.stateId ? statesMap.get(fixture.stateId) ?? null : null,
      ),
    ),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getFixture(
  id: number,
): Promise<DetailResponse<FixtureContract>> {
  const fixture = await findFixtureById(id);
  if (!fixture) throw new NotFoundError("Fixture");

  const statesMap = fixture.stateId
    ? await findFixtureStatesByIds([fixture.stateId])
    : new Map();
  const resolvedState = fixture.stateId
    ? statesMap.get(fixture.stateId) ?? null
    : null;

  return { data: toFixtureContract(fixture, resolvedState) };
}

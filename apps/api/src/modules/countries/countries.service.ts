import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { CountriesQuery, CountryContract } from "./countries.contracts.js";
import { toCountryContract } from "./countries.mapper.js";
import { findCountries, findCountryById } from "./countries.repository.js";

export async function listCountries(
  query: CountriesQuery,
): Promise<PaginatedResponse<CountryContract>> {
  const { countries, totalItems } = await findCountries(query);

  return {
    data: countries.map(toCountryContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
}

export async function getCountry(
  id: number,
): Promise<DetailResponse<CountryContract>> {
  const country = await findCountryById(id);

  if (!country) {
    throw new NotFoundError("Country");
  }

  return { data: toCountryContract(country) };
}

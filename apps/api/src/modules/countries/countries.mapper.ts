import type { Country } from "db";
import type { CountryContract, CountrySummary } from "./countries.contracts.js";

export function toCountryContract(country: Country): CountryContract {
  return {
    id: country.id,
    sportmonksId: country.sportmonksId,
    name: country.name,
    officialName: country.officialName,
    code: country.code,
    imageUrl: country.imageUrl,
    createdAt: country.createdAt.toISOString(),
    updatedAt: country.updatedAt.toISOString(),
  };
}

export function toCountrySummary(country: Country): CountrySummary {
  return {
    id: country.id,
    name: country.name,
    code: country.code,
    imageUrl: country.imageUrl,
  };
}

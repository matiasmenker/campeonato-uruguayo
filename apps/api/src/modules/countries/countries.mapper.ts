import type { Country } from "db";
import type { CountryContract, CountrySummary } from "./countries.contracts.js";
export const toCountryContract = (country: Country): CountryContract => {
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
};
export const toCountrySummary = (country: Country): CountrySummary => {
  return {
    id: country.id,
    name: country.name,
    code: country.code,
    imageUrl: country.imageUrl,
  };
};

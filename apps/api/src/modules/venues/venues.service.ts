import type { PaginatedResponse, DetailResponse } from "../../contracts/pagination.js";
import { buildPaginationMeta } from "../../contracts/pagination.js";
import { NotFoundError } from "../../http/errors.js";
import type { CitiesQuery, CityContract, VenuesQuery, VenueContract } from "./venues.contracts.js";
import { toCityContract, toVenueContract } from "./venues.mapper.js";
import { findCities, findCityById, findVenues, findVenueById } from "./venues.repository.js";
export const listCities = async (query: CitiesQuery): Promise<PaginatedResponse<CityContract>> => {
  const { cities, totalItems } = await findCities(query);
  return {
    data: cities.map(toCityContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getCity = async (id: number): Promise<DetailResponse<CityContract>> => {
  const city = await findCityById(id);
  if (!city) throw new NotFoundError("City");
  return { data: toCityContract(city) };
};
export const listVenues = async (query: VenuesQuery): Promise<PaginatedResponse<VenueContract>> => {
  const { venues, totalItems } = await findVenues(query);
  return {
    data: venues.map(toVenueContract),
    pagination: buildPaginationMeta(query.page, query.pageSize, totalItems),
  };
};
export const getVenue = async (id: number): Promise<DetailResponse<VenueContract>> => {
  const venue = await findVenueById(id);
  if (!venue) throw new NotFoundError("Venue");
  return { data: toVenueContract(venue) };
};

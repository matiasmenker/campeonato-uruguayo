import type { City, Venue, Country } from "db";
import { toCountrySummary } from "../countries/countries.mapper.js";
import type { CityContract, CitySummary, VenueContract, VenueSummary } from "./venues.contracts.js";

type CityWithCountry = City & { country: Country };

export function toCityContract(city: CityWithCountry): CityContract {
  return {
    id: city.id,
    sportmonksId: city.sportmonksId,
    name: city.name,
    country: toCountrySummary(city.country),
    createdAt: city.createdAt.toISOString(),
    updatedAt: city.updatedAt.toISOString(),
  };
}

export function toCitySummary(city: City): CitySummary {
  return {
    id: city.id,
    name: city.name,
  };
}

type VenueWithRelations = Venue & {
  country: Country | null;
  cityRecord: City | null;
};

export function toVenueContract(venue: VenueWithRelations): VenueContract {
  return {
    id: venue.id,
    sportmonksId: venue.sportmonksId,
    name: venue.name,
    city: venue.city,
    cityRecord: venue.cityRecord ? toCitySummary(venue.cityRecord) : null,
    country: venue.country ? toCountrySummary(venue.country) : null,
    capacity: venue.capacity,
    imagePath: venue.imagePath,
    createdAt: venue.createdAt.toISOString(),
    updatedAt: venue.updatedAt.toISOString(),
  };
}

export function toVenueSummary(venue: Venue): VenueSummary {
  return {
    id: venue.id,
    name: venue.name,
    city: venue.city,
    capacity: venue.capacity,
  };
}

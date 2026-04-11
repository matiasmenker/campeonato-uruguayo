import type { City, Venue, Country, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { CitiesQuery, VenuesQuery } from "./venues.contracts.js";
type CityWithCountry = City & {
  country: Country;
};
export const findCities = async (
  query: CitiesQuery
): Promise<{
  cities: CityWithCountry[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.CityWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "City"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  if (query.countryId) {
    where.countryId = query.countryId;
  }
  const [cities, totalItems] = await Promise.all([
    prisma.city.findMany({
      where,
      include: { country: true },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.city.count({ where }),
  ]);
  return { cities, totalItems };
};
export const findCityById = async (id: number): Promise<CityWithCountry | null> => {
  const prisma = getPrisma();
  return prisma.city.findUnique({
    where: { id },
    include: { country: true },
  });
};
type VenueWithRelations = Venue & {
  country: Country | null;
  cityRecord: City | null;
};
export const findVenues = async (
  query: VenuesQuery
): Promise<{
  venues: VenueWithRelations[];
  totalItems: number;
}> => {
  const prisma = getPrisma();
  const where: Prisma.VenueWhereInput = {};
  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<
      {
        id: number;
      }[]
    >`
      SELECT id FROM "Venue"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }
  if (query.countryId) {
    where.countryId = query.countryId;
  }
  if (query.cityId) {
    where.cityId = query.cityId;
  }
  const [venues, totalItems] = await Promise.all([
    prisma.venue.findMany({
      where,
      include: { country: true, cityRecord: true },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.venue.count({ where }),
  ]);
  return { venues, totalItems };
};
export const findVenueById = async (id: number): Promise<VenueWithRelations | null> => {
  const prisma = getPrisma();
  return prisma.venue.findUnique({
    where: { id },
    include: { country: true, cityRecord: true },
  });
};

import type { Country, Prisma } from "db";
import { getPrisma } from "../../database/index.js";
import type { CountriesQuery } from "./countries.contracts.js";

export async function findCountries(
  query: CountriesQuery
): Promise<{ countries: Country[]; totalItems: number }> {
  const prisma = getPrisma();
  const where: Prisma.CountryWhereInput = {};

  if (query.search) {
    const pattern = `%${query.search}%`;
    const matchingIds = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Country"
      WHERE unaccent("name") ILIKE unaccent(${pattern})
         OR unaccent("officialName") ILIKE unaccent(${pattern})
         OR "code" ILIKE ${pattern}
    `;
    where.id = { in: matchingIds.map((r) => r.id) };
  }

  const [countries, totalItems] = await Promise.all([
    prisma.country.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.country.count({ where }),
  ]);

  return { countries, totalItems };
}

export async function findCountryById(id: number): Promise<Country | null> {
  const prisma = getPrisma();
  return prisma.country.findUnique({ where: { id } });
}

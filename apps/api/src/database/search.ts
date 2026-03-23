import { Prisma } from "db";

/**
 * Builds a Prisma WHERE condition for accent-insensitive and case-insensitive search.
 * Uses PostgreSQL's `unaccent` extension.
 *
 * Example: unaccentSearch("name", "peñarol") matches "Peñarol", "Penarol", "peñarol", etc.
 */
export function unaccentContains(field: string, value: string): Prisma.Sql {
  const pattern = `%${value}%`;
  return Prisma.sql`unaccent(${Prisma.raw(`"${field}"`)}) ILIKE unaccent(${pattern})`;
}

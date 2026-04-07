import { Prisma } from "db";

export function unaccentContains(field: string, value: string): Prisma.Sql {
  const pattern = `%${value}%`;
  return Prisma.sql`unaccent(${Prisma.raw(`"${field}"`)}) ILIKE unaccent(${pattern})`;
}

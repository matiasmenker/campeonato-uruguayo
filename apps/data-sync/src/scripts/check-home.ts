import { PrismaClient } from "db"
const prisma = new PrismaClient()

const venues = await prisma.venue.findMany({ where: { imagePath: null }, select: { sportmonksId: true, name: true } })
console.log("=== VENUES WITHOUT IMAGE ===")
console.log(JSON.stringify(venues, null, 2))

const round = await prisma.round.findFirst({ where: { isCurrent: true }, select: { id: true, name: true } })
console.log("\n=== CURRENT ROUND ===", round)

const fixtures = await prisma.fixture.findMany({
  where: { roundId: round?.id },
  select: { id: true, homeScore: true, awayScore: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } }
})
console.log(`\n=== FIXTURES IN ROUND ${round?.name} (${fixtures.length} fixtures) ===`)
fixtures.forEach(fixture => console.log(`  ${fixture.homeTeam?.name} ${fixture.homeScore ?? "?"} - ${fixture.awayScore ?? "?"} ${fixture.awayTeam?.name}`))

await prisma.$disconnect()

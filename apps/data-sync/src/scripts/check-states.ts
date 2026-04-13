import { PrismaClient } from "db"
const prisma = new PrismaClient()
const states = await prisma.fixtureState.findMany({ select: { id: true, developerName: true, name: true, shortName: true } })
console.log(JSON.stringify(states, null, 2))
await prisma.$disconnect()

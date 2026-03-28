import { PrismaClient } from "db";
const db = new PrismaClient();

async function main() {
  const sfMissing = [
    "Franco Rossi", "Mauricio Affonso", "Federico Pintado", "Alan Di Pippa",
    "Bruno Hernandez", "Ezequiel Olivera", "Jeremias Perez",
    "Ruan Marvyn", "Gonzalo Silva", "Nicolas Gentilio", "Hernan Carroso",
    "Alejandro Garcia", "Gary Silva", "Keiner Perez",
  ];

  console.log("=== ¿Existen en Player table? ===");
  for (const name of sfMissing) {
    const lastName = name.split(" ").slice(-1)[0];
    const found = await db.player.findMany({
      where: { name: { contains: lastName, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (found.length === 0) {
      console.log("❌ NO EXISTE: " + name);
    } else {
      console.log("✅ EXISTE: " + name + " → " + found.map((p) => p.name).join(", "));
    }
  }

  // Total players with stats in this fixture (no squad filter)
  const fix = await db.fixture.findFirst({
    where: {
      season: { name: "2025" },
      stage: { name: "Apertura" },
      round: { name: "2" },
      homeTeam: { name: { contains: "Cerro Largo" } },
    },
  });

  const allPlayers: any[] = await db.$queryRaw`
    SELECT DISTINCT p.name
    FROM "FixturePlayerStatistic" fps
    JOIN "Player" p ON fps."playerId" = p.id
    WHERE fps."fixtureId" = ${fix!.id}
    ORDER BY p.name
  `;
  console.log("\n=== Todos los jugadores con stats en fixture (" + allPlayers.length + ") ===");
  allPlayers.forEach((p) => console.log("  " + p.name));

  await db.$disconnect();
}

main();

import { PrismaClient } from "db";

const db = new PrismaClient();

async function main() {
  const fixtureId = Number(process.argv[2]);
  if (!fixtureId) {
    console.log("Usage: npx tsx scripts/show-fixture.ts <fixtureId>");
    process.exit(1);
  }

  const fixture = await db.fixture.findUnique({
    where: { id: fixtureId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      round: { select: { name: true } },
    },
  });

  if (!fixture) {
    console.log("Fixture not found");
    process.exit(1);
  }

  console.log(
    `\n${fixture.homeTeam.name} ${fixture.homeScore} - ${fixture.awayScore} ${fixture.awayTeam.name} (Jornada ${fixture.round?.name})\n`
  );

  const currentSeason = await db.season.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });

  const stats = await db.fixturePlayerStatistic.findMany({
    where: { fixtureId },
    include: { player: { select: { id: true, name: true } } },
  });

  const squads = await db.squadMembership.findMany({
    where: { seasonId: currentSeason!.id },
    select: { playerId: true, teamId: true },
  });

  const teamByPlayer = new Map<number, number>();
  for (const s of squads) teamByPlayer.set(s.playerId, s.teamId);

  const playerStats = new Map<
    number,
    { name: string; team: string; stats: Map<number, number> }
  >();

  for (const s of stats) {
    const pid = s.player.id;
    if (!playerStats.has(pid)) {
      const tid = teamByPlayer.get(pid);
      const team =
        tid === fixture.homeTeamId
          ? fixture.homeTeam.name
          : tid === fixture.awayTeamId
            ? fixture.awayTeam.name
            : "DESCONOCIDO";
      playerStats.set(pid, { name: s.player.name, team, stats: new Map() });
    }
    const val = typeof s.value === "object" ? null : Number(s.value);
    if (val != null) playerStats.get(pid)!.stats.set(s.typeId, val);
  }

  const typeIds = { MIN: 119, RAT: 118, GOL: 52, ASI: 79, SHT: 42, SOT: 86, PAS: 80, ACP: 116, KPE: 117, TAC: 78, INT: 100 };
  const header = "Jugador | " + Object.keys(typeIds).join(" | ");

  for (const teamName of [fixture.homeTeam.name, fixture.awayTeam.name]) {
    console.log(`--- ${teamName} ---`);
    console.log(header);
    const teamPlayers = [...playerStats.values()]
      .filter((p) => p.team === teamName)
      .sort((a, b) => (b.stats.get(118) ?? 0) - (a.stats.get(118) ?? 0));

    for (const p of teamPlayers) {
      const vals = Object.values(typeIds).map((tid) => {
        const v = p.stats.get(tid);
        return v != null ? String(v) : "-";
      });
      console.log(`${p.name} | ${vals.join(" | ")}`);
    }

    const unknown = [...playerStats.values()].filter(
      (p) => p.team === "DESCONOCIDO"
    );
    if (unknown.length > 0 && teamName === fixture.awayTeam.name) {
      console.log(`\n⚠️  JUGADORES SIN EQUIPO: ${unknown.map((p) => p.name).join(", ")}`);
    }
    console.log();
  }

  const goals = await db.event.findMany({
    where: { fixtureId, typeId: 14 },
    include: { player: { select: { name: true } } },
    orderBy: { minute: "asc" },
  });
  if (goals.length > 0) {
    console.log("--- GOLES ---");
    for (const g of goals) {
      console.log(`Min ${g.minute}: ${g.player?.name} (${g.result})`);
    }
  }

  await db.$disconnect();
}

main();

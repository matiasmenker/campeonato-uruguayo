import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../../.env") });

import { PrismaClient } from 'db';
const db = new PrismaClient();

const STAT_LABELS: Record<number, string> = {
  118: 'Rating',
  119: 'Min',
  52:  'Goles',
  79:  'Asistencias',
  42:  'Tiros totales',
  86:  'Tiros al arco',
  41:  'Tiros fuera',
  97:  'Tiros bloqueados',
  80:  'Pases totales',
  116: 'Pases precisos',
  117: 'Pases clave',
  122: 'Pases largos',
  123: 'Pases largos prec.',
  78:  'Tackles',
  100: 'Intercepciones',
  101: 'Despejes',
  56:  'Faltas cometidas',
  96:  'Faltas recibidas',
  57:  'Paradas',
  98:  'Centros',
  99:  'Centros precisos',
  106: 'Duelos ganados',
  1491:'Duelos perdidos',
  107: 'Aéreos ganados',
  27266:'Aéreos perdidos',
  108: 'Regates intentados',
  109: 'Regates exitosos',
  120: 'Toques',
  51:  'Offsides',
  580: 'G. chances creadas',
  581: 'G. chances falladas',
  104: 'Paradas int. área',
  64:  'Golpe al palo',
  324: 'Goles en contra',
  94:  'Pérdidas de balón',
};

async function main() {
  const fixtures = await db.fixture.findMany({
    where: {
      round: {
        is: {
          name: { contains: '13' },
          stage: {
            is: {
              name: { contains: 'Clausura' },
              season: {
                is: {
                  startingAt: { gte: new Date('2024-01-01'), lt: new Date('2025-01-01') }
                }
              }
            }
          }
        }
      }
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      round: { select: { name: true, stage: { select: { name: true } } } },
      playerStats: {
        include: { player: { select: { name: true } } },
        orderBy: [{ playerId: 'asc' }, { typeId: 'asc' }]
      },
      lineups: {
        include: { player: { select: { name: true } } },
        orderBy: [{ jerseyNumber: 'asc' }]
      }
    },
    orderBy: { kickoffAt: 'asc' }
  });

  console.log(`\nTotal partidos: ${fixtures.length}`);

  for (const fixture of fixtures) {
    const home = fixture.homeTeam?.name ?? '?';
    const away = fixture.awayTeam?.name ?? '?';
    const score = `${fixture.homeScore ?? '?'} - ${fixture.awayScore ?? '?'}`;
    const fecha = fixture.kickoffAt?.toLocaleDateString('es-UY') ?? 'N/A';

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  ${home} ${score} ${away}`);
    console.log(`  ${fecha} · ${fixture.round?.name} · ${fixture.round?.stage?.name}`);
    console.log(`${'═'.repeat(70)}`);

    // Build stats map: playerId → { typeId → value }
    const statsByPlayer = new Map<number, Record<number, number>>();
    for (const s of fixture.playerStats) {
      if (!statsByPlayer.has(s.playerId)) statsByPlayer.set(s.playerId, {});
      const raw = s.value;
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
      statsByPlayer.get(s.playerId)![s.typeId ?? 0] = num;
    }

    const homePlayers = fixture.lineups.filter(l => l.teamId === fixture.homeTeamId);
    const awayPlayers = fixture.lineups.filter(l => l.teamId === fixture.awayTeamId);
    const unresolved  = fixture.lineups.filter(l => l.teamId !== fixture.homeTeamId && l.teamId !== fixture.awayTeamId);

    const printTeam = (teamName: string, players: typeof fixture.lineups) => {
      if (players.length === 0) return;
      console.log(`\n  ┌─ ${teamName} (${players.length} jugadores) ${'─'.repeat(Math.max(0, 50 - teamName.length))}┐`);
      for (const lp of players) {
        const stats = statsByPlayer.get(lp.playerId) ?? {};
        const rating  = stats[118] != null ? stats[118].toFixed(1) : '—';
        const minutes = stats[119] != null ? `${stats[119]}min` : '—';
        const goals   = stats[52]  ?? 0;
        const assists = stats[79]  ?? 0;

        const badges = [
          goals   > 0 ? `⚽ ${goals}` : '',
          assists > 0 ? `🅰️  ${assists}` : '',
        ].filter(Boolean).join('  ');

        console.log(`\n  │  #${String(lp.jerseyNumber ?? '?').padEnd(3)} ${lp.player.name}  ${badges}`);
        console.log(`  │       Rating: ${rating}  |  ${minutes}`);

        if (Object.keys(stats).length === 0) {
          console.log(`  │       (sin estadísticas registradas)`);
          continue;
        }

        // Shooting
        const tTiros = stats[42]; const tArco = stats[86]; const tFuera = stats[41]; const tBloq = stats[97];
        if (tTiros != null || tArco != null) {
          const parts: string[] = [];
          if (tTiros  != null) parts.push(`Tiros: ${tTiros}`);
          if (tArco   != null) parts.push(`al arco: ${tArco}`);
          if (tFuera  != null) parts.push(`fuera: ${tFuera}`);
          if (tBloq   != null) parts.push(`bloq.: ${tBloq}`);
          console.log(`  │       ${parts.join('  |  ')}`);
        }

        // Passing
        const pTot = stats[80]; const pPrec = stats[116]; const pClave = stats[117];
        const pLarg = stats[122]; const pLargPrec = stats[123];
        if (pTot != null) {
          const pct = (pTot > 0 && pPrec != null) ? ` (${Math.round(pPrec / pTot * 100)}% precisos)` : '';
          const kp  = pClave != null ? `  |  Pases clave: ${pClave}` : '';
          const lb  = pLarg  != null ? `  |  Pases largos: ${pLargPrec ?? '?'}/${pLarg}` : '';
          console.log(`  │       Pases: ${pTot}${pct}${kp}${lb}`);
        }

        // Defence
        const tTackle = stats[78]; const intercept = stats[100]; const despeje = stats[101];
        if (tTackle != null || intercept != null || despeje != null) {
          const parts: string[] = [];
          if (tTackle   != null) parts.push(`Tackles: ${tTackle}`);
          if (intercept != null) parts.push(`Interc.: ${intercept}`);
          if (despeje   != null) parts.push(`Despejes: ${despeje}`);
          console.log(`  │       ${parts.join('  |  ')}`);
        }

        // Duels & aerials
        const dW = stats[106]; const dL = stats[1491];
        const aW = stats[107]; const aL = stats[27266];
        if (dW != null || aW != null) {
          const parts: string[] = [];
          if (dW != null || dL != null) parts.push(`Duelos: ${(dW ?? 0) + (dL ?? 0)} (${dW ?? 0} gan.)`);
          if (aW != null || aL != null) parts.push(`Aéreos: ${(aW ?? 0) + (aL ?? 0)} (${aW ?? 0} gan.)`);
          console.log(`  │       ${parts.join('  |  ')}`);
        }

        // Dribbles, fouls, misc
        const dribA = stats[108]; const dribW = stats[109];
        const foulC = stats[56];  const foulR = stats[96];
        const saves = stats[57];  const offside = stats[51];
        const touches = stats[120]; const disp = stats[94];

        const misc: string[] = [];
        if (dribA != null || dribW != null) misc.push(`Regates: ${dribW ?? 0}/${dribA ?? 0}`);
        if (foulC != null) misc.push(`Faltas: ${foulC}`);
        if (foulR != null) misc.push(`Recibidas: ${foulR}`);
        if (saves  != null && saves  > 0) misc.push(`Paradas: ${saves}`);
        if (offside != null && offside > 0) misc.push(`Offsides: ${offside}`);
        if (touches != null) misc.push(`Toques: ${touches}`);
        if (disp    != null && disp    > 0) misc.push(`Pérdidas: ${disp}`);
        if (misc.length > 0) console.log(`  │       ${misc.join('  |  ')}`);

        // Bonus stats
        const bigCC = stats[580]; const bigCM = stats[581];
        const hitW  = stats[64];  const ownG  = stats[324];
        const parad = stats[104];
        const bonus: string[] = [];
        if (bigCC != null && bigCC > 0) bonus.push(`G. chances creadas: ${bigCC}`);
        if (bigCM != null && bigCM > 0) bonus.push(`G. chances falladas: ${bigCM}`);
        if (hitW  != null && hitW  > 0) bonus.push(`Golpe al palo: ${hitW}`);
        if (ownG  != null && ownG  > 0) bonus.push(`Goles en contra: ${ownG}`);
        if (parad != null && parad > 0) bonus.push(`Paradas int. área: ${parad}`);
        if (bonus.length > 0) console.log(`  │       ${bonus.join('  |  ')}`);
      }
      console.log(`  └${'─'.repeat(68)}┘`);
    };

    printTeam(home, homePlayers);
    printTeam(away, awayPlayers);

    if (unresolved.length > 0) {
      console.log(`\n  ⚠️  ${unresolved.length} jugador(es) sin equipo determinado:`);
      for (const lp of unresolved) console.log(`     - #${lp.jerseyNumber ?? '?'} ${lp.player.name} (teamId=${lp.teamId})`);
    }

    console.log(`\n  Stats totales: ${fixture.playerStats.length} | Jugadores únicos con stats: ${statsByPlayer.size}`);
  }

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

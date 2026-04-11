import { chromium, type Browser, type Page } from "playwright";
import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { FixtureDto } from "sportmonks-client";
const EXTERNAL_TOURNAMENT_ID = 278;
const EXTERNAL_BASE_URL = process.env["EXTERNAL_STATS_URL"] ?? "https://www.sofascore.com";
const COMPLETE_STAT_INDICATORS = [80, 78, 116, 42, 122];
const STAGE_TO_PREFIX: Record<string, string> = {
  apertura: "Apertura",
  clausura: "Clausura",
  "intermediate round": "Intermedio",
};
interface ReportDependencies {
  db: PrismaClient;
  client: SportMonksClient;
}
interface ExternalEvent {
  id: number;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
  };
  startTimestamp: number;
}
interface ExternalLineups {
  home: {
    players: {
      player: {
        name: string;
      };
      statistics?: Record<string, unknown>;
    }[];
  };
  away: {
    players: {
      player: {
        name: string;
      };
      statistics?: Record<string, unknown>;
    }[];
  };
}
const normalize = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const delayMs = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const fetchJson = async <T>(page: Page, endpoint: string): Promise<T | null> => {
  try {
    const result = await page.evaluate(async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return { __error: true, status: res.status };
        return res.json();
      } finally {
        clearTimeout(id);
      }
    }, `${EXTERNAL_BASE_URL}${endpoint}`);
    if (result && typeof result === "object" && "__error" in result) {
      return null;
    }
    await delayMs(800);
    return result as T | null;
  } catch {
    return null;
  }
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";
const BG_GREEN = "\x1b[42m";
const BG_RED = "\x1b[41m";
const BG_YELLOW = "\x1b[43m";
const badge = (text: string, bg: string): string => {
  return `${BOLD}${bg}${WHITE} ${text} ${RESET}`;
};
const printTable = (
  headers: string[],
  rows: string[][],
  colorFn?: (cell: string, col: number) => string
): void => {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i]?.length ?? 0))
  );
  const sep = colWidths.map((w) => "─".repeat(w + 2)).join("┼");
  console.log(`┌${sep.replace(/┼/g, "┬")}┐`);
  console.log(`│${headers.map((h, i) => ` ${BOLD}${h.padEnd(colWidths[i])}${RESET} `).join("│")}│`);
  console.log(`├${sep}┤`);
  for (const row of rows) {
    const cells = row.map((cell, i) => {
      const padded = cell.padEnd(colWidths[i]);
      const styled = colorFn ? colorFn(cell, i) : null;
      return ` ${styled ?? padded} `;
    });
    console.log(`│${cells.join("│")}│`);
  }
  console.log(`└${sep.replace(/┼/g, "┴")}┘`);
};
export const reportDataStatus = async ({ db, client }: ReportDependencies): Promise<void> => {
  const seasonArg = process.argv.find((a) => a.startsWith("--season="))?.split("=")[1];
  const groupArg = process.argv.find((a) => a.startsWith("--group="))?.split("=")[1];
  const jornadaArg = process.argv.find((a) => a.startsWith("--jornada="))?.split("=")[1];
  if (!seasonArg || !groupArg || !jornadaArg) {
    console.error("Usage: report:data-status -- --season=2026 --group=Apertura --jornada=10");
    process.exit(1);
  }
  console.log();
  console.log(
    `${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${RESET}`
  );
  console.log(
    `${BOLD}${CYAN}║  📊 DATA STATUS — Season ${seasonArg}, ${groupArg}, Jornada ${jornadaArg.padEnd(25)}║${RESET}`
  );
  console.log(
    `${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${RESET}`
  );
  console.log();
  const season = await db.season.findFirst({
    where: { name: { contains: seasonArg } },
    select: { id: true, name: true },
  });
  if (!season) {
    console.error(`${RED}Season "${seasonArg}" not found${RESET}`);
    return;
  }
  const stage = await db.stage.findFirst({
    where: { seasonId: season.id, name: { contains: groupArg, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!stage) {
    console.error(`${RED}Stage matching "${groupArg}" not found in season ${seasonArg}${RESET}`);
    return;
  }
  const fixtures = await db.fixture.findMany({
    where: { seasonId: season.id, stageId: stage.id, round: { name: jornadaArg }, stateId: 5 },
    select: {
      id: true,
      sportmonksId: true,
      kickoffAt: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      playerStats: { select: { typeId: true, sportmonksId: true } },
      events: { select: { id: true } },
      lineups: { select: { id: true } },
    },
    orderBy: { kickoffAt: "asc" },
  });
  if (fixtures.length === 0) {
    console.log(
      `${RED}No finished fixtures found for ${seasonArg}, ${groupArg}, jornada ${jornadaArg}${RESET}`
    );
    return;
  }
  console.log(
    `${BOLD}${WHITE}📋 Finished fixtures in DB: ${fixtures.length} (${stage.name})${RESET}`
  );
  console.log();
  console.log(`${DIM}🔵 Fetching from SportMonks API...${RESET}`);
  const sportmonksIds = fixtures.map((f) => f.sportmonksId);
  type ApiFixture = FixtureDto & {
    lineups?: Array<{
      player_id?: number;
      player?: {
        id: number;
      };
      details?: Array<{
        type_id?: number;
      }>;
    }>;
    statistics?: Array<{
      type_id?: number;
      player_id?: number;
      player?: {
        id: number;
      };
    }>;
    events?: Array<{
      id?: number;
    }>;
  };
  let apiFixtures: ApiFixture[] = [];
  let sportMonksError: string | null = null;
  try {
    const raw = await client.get<ApiFixture[]>(`/fixtures/multi/${sportmonksIds.join(",")}`, {
      include: "events;lineups;lineups.details;statistics",
    });
    const asArray = Array.isArray(raw)
      ? raw
      : ((
          raw as unknown as {
            data: ApiFixture[];
          }
        )?.data ?? []);
    apiFixtures = asArray;
    console.log(`${GREEN}   ✅ SportMonks returned ${apiFixtures.length} fixtures${RESET}`);
  } catch (error) {
    sportMonksError = error instanceof Error ? error.message : String(error);
    console.log(`${RED}   ❌ SportMonks API error: ${sportMonksError}${RESET}`);
  }
  const apiFixtureById = new Map(apiFixtures.map((f) => [f.id, f]));
  console.log(`${DIM}🟠 Fetching from SoFaScore...${RESET}`);
  let browser: Browser | null = null;
  let page: Page | null = null;
  let externalEvents: ExternalEvent[] = [];
  let sofaScoreError: string | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    page = await context.newPage();
    await page.goto(`${EXTERNAL_BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const seasonData = await fetchJson<{
      seasons: {
        id: number;
        year: string;
      }[];
    }>(page, `/api/v1/unique-tournament/${EXTERNAL_TOURNAMENT_ID}/seasons`);
    const externalSeasonId = seasonData?.seasons?.find((s) => s.year === seasonArg)?.id ?? null;
    if (externalSeasonId) {
      const lower = (stage.name ?? "").toLowerCase();
      let prefix: string | null = null;
      for (const [key, val] of Object.entries(STAGE_TO_PREFIX)) {
        if (lower.includes(key)) {
          prefix = val;
          break;
        }
      }
      if (prefix) {
        const data = await fetchJson<{
          events: ExternalEvent[];
        }>(
          page,
          `/api/v1/unique-tournament/${EXTERNAL_TOURNAMENT_ID}/season/${externalSeasonId}/events/round/${jornadaArg}/prefix/${prefix}`
        );
        externalEvents = data?.events ?? [];
        console.log(`${GREEN}   ✅ SoFaScore returned ${externalEvents.length} events${RESET}`);
      } else {
        sofaScoreError = `Stage prefix not mapped for "${stage.name}"`;
        console.log(`${YELLOW}   ⚠️ ${sofaScoreError}${RESET}`);
      }
    } else {
      sofaScoreError = `Season "${seasonArg}" not found in SoFaScore`;
      console.log(`${YELLOW}   ⚠️ ${sofaScoreError}${RESET}`);
    }
  } catch (error) {
    sofaScoreError = error instanceof Error ? error.message : String(error);
    console.log(`${RED}   ❌ SoFaScore error: ${sofaScoreError}${RESET}`);
  }
  console.log();
  interface FixtureStatus {
    label: string;
    db: {
      totalStats: number;
      source: string;
      complete: boolean;
      events: number;
      lineups: number;
    };
    sportMonks: {
      playerStats: number;
      events: number;
      lineups: number;
      hasDetailedStats: boolean;
      error: string | null;
    };
    sofaScore: {
      status: string;
      playersWithStats: number;
      error: string | null;
    };
    verdict: string;
  }
  const statuses: FixtureStatus[] = [];
  for (const fixture of fixtures) {
    const home = fixture.homeTeam?.name ?? "?";
    const away = fixture.awayTeam?.name ?? "?";
    const label = `${home} ${fixture.homeScore}-${fixture.awayScore} ${away}`;
    const fromSportMonks = fixture.playerStats.filter((s) => s.sportmonksId !== null).length;
    const fromSoFaScore = fixture.playerStats.filter((s) => s.sportmonksId === null).length;
    const hasCompleteStats = COMPLETE_STAT_INDICATORS.every((id) =>
      fixture.playerStats.some((s) => s.typeId === id)
    );
    const source =
      fromSoFaScore > 0 && fromSportMonks === 0
        ? "SoFaScore"
        : fromSportMonks > 0 && fromSoFaScore === 0
          ? "SportMonks"
          : fromSportMonks > 0 && fromSoFaScore > 0
            ? "Mixed"
            : "None";
    const apiFixture = apiFixtureById.get(fixture.sportmonksId);
    let smPlayerStats = 0;
    let smEvents = 0;
    let smLineups = 0;
    let smHasDetailed = false;
    let smError: string | null = sportMonksError;
    if (apiFixture) {
      const allLineupDetails = (apiFixture.lineups ?? []).flatMap((l) => l.details ?? []);
      const playerStatistics = (apiFixture.statistics ?? []).filter(
        (s) => s.player_id != null || s.player?.id != null
      );
      smPlayerStats = allLineupDetails.length + playerStatistics.length;
      smEvents = (apiFixture.events ?? []).length;
      smLineups = (apiFixture.lineups ?? []).length;
      const allTypeIds = new Set([
        ...allLineupDetails.map((d) => d.type_id),
        ...playerStatistics.map((s) => s.type_id),
      ]);
      smHasDetailed = COMPLETE_STAT_INDICATORS.every((id) => allTypeIds.has(id));
    } else if (!sportMonksError) {
      smError = "Not returned by API";
    }
    let sfsStatus = "—";
    let sfsPlayersWithStats = 0;
    let sfsError: string | null = sofaScoreError;
    if (page && externalEvents.length > 0) {
      const normHome = normalize(home);
      const normAway = normalize(away);
      const matched = externalEvents.find((evt) => {
        const evtHome = normalize(evt.homeTeam.name);
        const evtAway = normalize(evt.awayTeam.name);
        return (
          (evtHome.includes(normHome.substring(0, 5)) ||
            normHome.includes(evtHome.substring(0, 5))) &&
          (evtAway.includes(normAway.substring(0, 5)) || normAway.includes(evtAway.substring(0, 5)))
        );
      });
      if (matched) {
        const lineups = await fetchJson<ExternalLineups>(
          page,
          `/api/v1/event/${matched.id}/lineups`
        );
        if (lineups?.home?.players?.length && lineups?.away?.players?.length) {
          const allPlayers = [...lineups.home.players, ...lineups.away.players];
          const withStats = allPlayers.filter(
            (p) => p.statistics && Object.keys(p.statistics).length > 5
          );
          sfsPlayersWithStats = withStats.length;
          sfsStatus = sfsPlayersWithStats > 0 ? "DETAILED" : "BASIC_ONLY";
        } else {
          sfsStatus = "NO_LINEUPS";
        }
      } else {
        sfsStatus = "NOT_FOUND";
      }
    } else if (!sofaScoreError && externalEvents.length === 0 && page) {
      sfsStatus = "NO_EVENTS";
    }
    let verdict: string;
    if (hasCompleteStats) {
      verdict = "✅ OK";
    } else if (smHasDetailed) {
      verdict = "🔄 SM READY";
    } else if (sfsPlayersWithStats > 0) {
      verdict = "🔄 SFS READY";
    } else {
      verdict = "❌ NO DATA";
    }
    statuses.push({
      label,
      db: {
        totalStats: fixture.playerStats.length,
        source,
        complete: hasCompleteStats,
        events: fixture.events.length,
        lineups: fixture.lineups.length,
      },
      sportMonks: {
        playerStats: smPlayerStats,
        events: smEvents,
        lineups: smLineups,
        hasDetailedStats: smHasDetailed,
        error: smError,
      },
      sofaScore: { status: sfsStatus, playersWithStats: sfsPlayersWithStats, error: sfsError },
      verdict,
    });
  }
  console.log(`${BOLD}${WHITE}📊 DB vs External Sources Comparison:${RESET}`);
  console.log();
  const headers = [
    "Match",
    "DB Stats",
    "DB Source",
    "DB OK?",
    "SM Stats",
    "SM Detail?",
    "SFS Stats",
    "SFS Players",
    "Verdict",
  ];
  const rows = statuses.map((s) => [
    s.label,
    String(s.db.totalStats),
    s.db.source,
    s.db.complete ? "YES" : "NO",
    String(s.sportMonks.playerStats),
    s.sportMonks.hasDetailedStats ? "YES" : "NO",
    s.sofaScore.status,
    String(s.sofaScore.playersWithStats),
    s.verdict,
  ]);
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  printTable(headers, rows, (cell, col) => {
    const padded = cell.padEnd(colWidths[col]);
    if (col === 3) return cell === "YES" ? `${GREEN}${padded}${RESET}` : `${RED}${padded}${RESET}`;
    if (col === 5)
      return cell === "YES" ? `${GREEN}${padded}${RESET}` : `${YELLOW}${padded}${RESET}`;
    if (col === 6) {
      if (cell === "DETAILED") return `${GREEN}${padded}${RESET}`;
      if (cell === "BASIC_ONLY" || cell === "NO_EVENTS") return `${YELLOW}${padded}${RESET}`;
      if (cell === "NOT_FOUND" || cell === "NO_LINEUPS") return `${RED}${padded}${RESET}`;
      return `${DIM}${padded}${RESET}`;
    }
    if (col === 8) {
      if (cell.includes("OK")) return `${GREEN}${BOLD}${padded}${RESET}`;
      if (cell.includes("READY")) return `${YELLOW}${BOLD}${padded}${RESET}`;
      return `${RED}${BOLD}${padded}${RESET}`;
    }
    return padded;
  });
  console.log();
  console.log(`${BOLD}${WHITE}🔍 Detail per fixture:${RESET}`);
  for (const s of statuses) {
    const icon = s.db.complete ? GREEN + "✅" : RED + "❌";
    console.log();
    console.log(`${icon} ${BOLD}${s.label}${RESET}`);
    console.log(
      `   ${CYAN}DB:${RESET}         ${s.db.totalStats} stats (${s.db.source}) | ${s.db.events} events | ${s.db.lineups} lineups | Complete: ${s.db.complete ? "YES" : "NO"}`
    );
    console.log(
      `   ${CYAN}SportMonks:${RESET} ${s.sportMonks.playerStats} stats | ${s.sportMonks.events} events | ${s.sportMonks.lineups} lineups | Detailed: ${s.sportMonks.hasDetailedStats ? "YES" : "NO"}${s.sportMonks.error ? ` | ⚠️ ${s.sportMonks.error}` : ""}`
    );
    console.log(
      `   ${CYAN}SoFaScore:${RESET}  ${s.sofaScore.status} | ${s.sofaScore.playersWithStats} players with stats${s.sofaScore.error ? ` | ⚠️ ${s.sofaScore.error}` : ""}`
    );
    if (s.db.complete) {
      console.log(`   ${GREEN}→ No action needed${RESET}`);
    } else if (s.sportMonks.hasDetailedStats && !s.db.complete) {
      console.log(
        `   ${YELLOW}→ SportMonks has detailed data. Running sync:daily or sync:fixture-details would fetch it.${RESET}`
      );
    } else if (s.sofaScore.playersWithStats > 0 && !s.db.complete) {
      console.log(
        `   ${YELLOW}→ SoFaScore has data. Running sync:fill-stats -- --season=${seasonArg} would fetch it.${RESET}`
      );
    } else {
      console.log(
        `   ${RED}→ No source has detailed data right now. They may not be available yet.${RESET}`
      );
    }
  }
  console.log();
  console.log(`${BOLD}═══════════════════════════════════════${RESET}`);
  const okCount = statuses.filter((s) => s.verdict.includes("OK")).length;
  const smReadyCount = statuses.filter((s) => s.verdict.includes("SM READY")).length;
  const sfsReadyCount = statuses.filter((s) => s.verdict.includes("SFS READY")).length;
  const noDataCount = statuses.filter((s) => s.verdict.includes("NO DATA")).length;
  console.log(`  ${GREEN}✅ Complete in DB:${RESET}              ${okCount}/${statuses.length}`);
  if (smReadyCount > 0) {
    console.log(`  ${YELLOW}🔄 Recoverable from SportMonks:${RESET}   ${smReadyCount}`);
    console.log(`     ${DIM}→ pnpm --filter data-sync sync:fixture-details${RESET}`);
  }
  if (sfsReadyCount > 0) {
    console.log(`  ${YELLOW}🔄 Recoverable from SoFaScore:${RESET}    ${sfsReadyCount}`);
    console.log(
      `     ${DIM}→ pnpm --filter data-sync sync:fill-stats -- --season=${seasonArg}${RESET}`
    );
  }
  if (noDataCount > 0) {
    console.log(`  ${RED}❌ No data in any source:${RESET}  ${noDataCount}`);
  }
  console.log(`${BOLD}═══════════════════════════════════════${RESET}`);
  console.log();
  if (browser) await browser.close();
};

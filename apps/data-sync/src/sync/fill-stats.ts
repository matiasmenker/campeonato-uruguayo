import { chromium, type Browser, type Page } from "playwright";
import type { SyncDependencies } from "./shared.js";

const EXTERNAL_TOURNAMENT_ID = 278;
const EXTERNAL_BASE_URL = process.env["EXTERNAL_STATS_URL"] ?? "https://www.sofascore.com";

const EXTERNAL_TO_STAT_TYPE: Record<string, number> = {
  minutesPlayed: 119,
  rating: 118,
  goals: 52,
  goalAssist: 79,
  totalShots: 42,
  onTargetScoringAttempt: 86,
  shotOffTarget: 41,
  blockedScoringAttempt: 97,
  totalPass: 80,
  accuratePass: 116,
  keyPass: 117,
  totalTackle: 78,
  wonTackle: 78,
  interceptionWon: 100,
  totalClearance: 101,
  fouls: 56,
  wasFouled: 96,
  saves: 57,
  totalCross: 98,
  accurateCross: 99,
  duelWon: 106,
  duelLost: 1491,
  aerialWon: 107,
  aerialLost: 27266,
  totalContest: 108,
  wonContest: 109,
  touches: 120,
  totalOffside: 51,
  totalLongBalls: 122,
  accurateLongBalls: 123,
  bigChanceCreated: 580,
  bigChanceMissed: 581,
  goodHighClaim: 584,
  savedShotsFromInsideTheBox: 104,
  hitWoodwork: 64,
  ownGoals: 324,
  dispossessed: 94,
};

// Stat types that are ALWAYS present in fixtures with complete statistics.
// If a fixture has NONE of these, it only has basic data (minutes, goals, cards, rating).
const COMPLETE_STAT_INDICATORS = [
  80,   // Total passes
  78,   // Total tackles
  116,  // Accurate passes
  42,   // Total shots
  122,  // Total long balls
];

const normalize = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

interface ExternalEvent {
  id: number;
  homeTeam: { name: string; id: number };
  awayTeam: { name: string; id: number };
  startTimestamp: number;
}

interface ExternalPlayer {
  player: { name: string; id: number };
  jerseyNumber?: string;
  statistics?: Record<string, number | null | Record<string, unknown>>;
}

interface ExternalLineups {
  home: { players: ExternalPlayer[] };
  away: { players: ExternalPlayer[] };
}

async function createBrowser(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  await page.goto(`${EXTERNAL_BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  return { browser, page };
}

const FETCH_TIMEOUT_MS = 15_000;
const FETCH_MAX_RETRIES = 3;
const FETCH_DELAY_MS = 800;
const FETCH_RETRY_DELAY_MS = 3_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(page: Page, endpoint: string, log?: SyncDependencies["log"]): Promise<T | null> {
  for (let attempt = 1; attempt <= FETCH_MAX_RETRIES; attempt++) {
    try {
      const result = await page.evaluate(async (url: string) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 12_000);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) return { __error: true, status: res.status };
          return res.json();
        } finally {
          clearTimeout(id);
        }
      }, `${EXTERNAL_BASE_URL}${endpoint}`);

      if (result && typeof result === "object" && "__error" in result) {
        const status = (result as { status: number }).status;
        if (status === 403 || status === 429) {
          log?.warn(`⚠️  Fetch ${endpoint} → HTTP ${status}, retry ${attempt}/${FETCH_MAX_RETRIES}...`);
          await delay(FETCH_RETRY_DELAY_MS * attempt);
          continue;
        }
        log?.warn(`⚠️  Fetch ${endpoint} → HTTP ${status}`);
        return null;
      }

      await delay(FETCH_DELAY_MS);
      return result as T | null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt < FETCH_MAX_RETRIES) {
        log?.warn(`⚠️  Fetch ${endpoint} failed (attempt ${attempt}/${FETCH_MAX_RETRIES}): ${message}`);
        await delay(FETCH_RETRY_DELAY_MS * attempt);
        continue;
      }
      log?.error(`❌ Fetch ${endpoint} failed after ${FETCH_MAX_RETRIES} attempts: ${message}`);
      return null;
    }
  }
  return null;
}

async function findExternalSeasonId(page: Page, year: string, log?: SyncDependencies["log"]): Promise<number | null> {
  const data = await fetchJson<{ seasons: { id: number; year: string }[] }>(
    page,
    `/api/v1/unique-tournament/${EXTERNAL_TOURNAMENT_ID}/seasons`,
    log,
  );
  if (!data?.seasons) return null;
  return data.seasons.find((s) => s.year === year)?.id ?? null;
}

/**
 * Maps our DB stage names to the external source prefix.
 */
const STAGE_TO_PREFIX: Record<string, string> = {
  apertura: "Apertura",
  clausura: "Clausura",
  "intermediate round": "Intermedio",
};

function stageToExternalPrefix(stageName: string): string | null {
  const lower = stageName.toLowerCase();
  for (const [key, prefix] of Object.entries(STAGE_TO_PREFIX)) {
    if (lower.includes(key)) return prefix;
  }
  return null;
}

async function findExternalEvents(
  page: Page,
  seasonId: number,
  roundName: string,
  stageName: string,
  log?: SyncDependencies["log"],
): Promise<ExternalEvent[]> {
  const prefix = stageToExternalPrefix(stageName);
  if (!prefix) return []; // Finals/Semi-finals — not mapped

  const data = await fetchJson<{ events: ExternalEvent[] }>(
    page,
    `/api/v1/unique-tournament/${EXTERNAL_TOURNAMENT_ID}/season/${seasonId}/events/round/${roundName}/prefix/${prefix}`,
    log,
  );
  return data?.events ?? [];
}

function matchFixtureToEvent(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: Date,
  events: ExternalEvent[]
): ExternalEvent | null {
  const normHome = normalize(homeTeam);
  const normAway = normalize(awayTeam);
  const kickoffMs = kickoffAt.getTime();

  return (
    events.find((evt) => {
      const evtHome = normalize(evt.homeTeam.name);
      const evtAway = normalize(evt.awayTeam.name);
      const evtMs = evt.startTimestamp * 1000;

      const homeMatch =
        evtHome.includes(normHome.substring(0, 5)) || normHome.includes(evtHome.substring(0, 5));
      const awayMatch =
        evtAway.includes(normAway.substring(0, 5)) || normAway.includes(evtAway.substring(0, 5));
      // Allow ±25h tolerance: late-night matches can cross midnight UTC between sources
      const dateMatch = Math.abs(evtMs - kickoffMs) <= 25 * 60 * 60 * 1000;

      return homeMatch && awayMatch && dateMatch;
    }) ?? null
  );
}

/**
 * Checks if all words from the external name exist in the DB name.
 * Supports initials: a 1-2 char word matches if a DB word starts with it.
 * Returns true only if at least one non-initial word matches.
 */
function allWordsMatch(extWords: string[], dbWords: string[]): boolean {
  let hasFullWordMatch = false;

  for (const extWord of extWords) {
    const isInitial = extWord.length <= 2;

    const found = isInitial
      ? dbWords.some((dbWord) => dbWord.startsWith(extWord))
      : dbWords.some((dbWord) => dbWord === extWord);

    if (!found) return false;
    if (!isInitial) hasFullWordMatch = true;
  }

  return hasFullWordMatch;
}

interface PlayerCandidate {
  id: number;
  name: string;
  jerseyNumber?: number | null;
  shirtNumber?: number | null;
}

function matchPlayer(
  externalName: string,
  dbPlayers: PlayerCandidate[],
  externalJerseyNumber?: number | null
): number | null {
  const extNorm = normalize(externalName);

  // Level 1: Exact normalized match
  for (const dbPlayer of dbPlayers) {
    if (normalize(dbPlayer.name) === extNorm) return dbPlayer.id;
  }

  // Level 2: Substring match (one contains the other)
  for (const dbPlayer of dbPlayers) {
    const dbNorm = normalize(dbPlayer.name);
    if (extNorm.includes(dbNorm) || dbNorm.includes(extNorm)) return dbPlayer.id;
  }

  // Level 3: All words match (with initial support)
  const extWords = extNorm.split(" ").filter((w) => w.length > 0);
  const candidates: PlayerCandidate[] = [];

  for (const dbPlayer of dbPlayers) {
    const dbWords = normalize(dbPlayer.name).split(" ").filter((w) => w.length > 0);
    if (allWordsMatch(extWords, dbWords)) {
      candidates.push(dbPlayer);
    }
  }

  if (candidates.length === 1) return candidates[0].id;

  // Level 4: Multiple candidates — use jersey number as tiebreaker
  if (candidates.length > 1 && externalJerseyNumber != null) {
    const byJersey = candidates.find((c) => c.jerseyNumber === externalJerseyNumber);
    if (byJersey) return byJersey.id;
  }

  // Level 5: Jersey number only match (last resort)
  if (externalJerseyNumber != null) {
    const byJersey = dbPlayers.filter((p) => p.jerseyNumber === externalJerseyNumber);
    if (byJersey.length === 1) return byJersey[0].id;
  }

  return null;
}

export interface FillStatsOptions {
  seasonName?: string; // e.g. "2025" — if omitted, uses current season
}

export async function syncFillStats(
  { db, log }: SyncDependencies,
  options?: FillStatsOptions
): Promise<void> {
  log.info("=== FILL STATS START ===");
  log.info("🚀 Filling missing fixture stats from external source...");

  const seasonFilter = options?.seasonName
    ? { name: options.seasonName }
    : { isCurrent: true as const };

  const targetSeason = await db.season.findFirst({
    where: seasonFilter,
    select: { id: true, sportmonksId: true, name: true },
  });

  if (!targetSeason) {
    log.warn(`⚠️  Season ${options?.seasonName ?? "current"} not found. Skipping fill-stats.`);
    return;
  }

  log.info(`📅 Target season: ${targetSeason.name}`);

  const fixturesWithBasicStats = await db.$queryRaw<
    {
      fixtureId: number;
      sportmonksId: number;
      homeTeamId: number;
      awayTeamId: number;
      homeTeam: string;
      awayTeam: string;
      kickoffAt: Date;
      roundName: string;
      stageName: string;
    }[]
  >`
    SELECT f.id as "fixtureId", f."sportmonksId",
      f."homeTeamId" as "homeTeamId", f."awayTeamId" as "awayTeamId",
      ht.name as "homeTeam", at2.name as "awayTeam",
      f."kickoffAt", r.name as "roundName", st.name as "stageName"
    FROM "Fixture" f
    JOIN "Round" r ON f."roundId" = r.id
    LEFT JOIN "Stage" st ON f."stageId" = st.id
    LEFT JOIN "Team" ht ON f."homeTeamId" = ht.id
    LEFT JOIN "Team" at2 ON f."awayTeamId" = at2.id
    WHERE f."seasonId" = ${targetSeason.id}
      AND f."stateId" = 5
      AND f."kickoffAt" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "FixturePlayerStatistic" fps
        WHERE fps."fixtureId" = f.id
          AND fps."typeId" = ANY(${COMPLETE_STAT_INDICATORS})
      )
    ORDER BY f."kickoffAt" DESC
  `;

  if (fixturesWithBasicStats.length === 0) {
    log.info("✅ All fixtures already have complete stats. Nothing to fill.");
    return;
  }

  log.info(`📊 Fixtures with incomplete stats: ${fixturesWithBasicStats.length}`);
  for (const fixture of fixturesWithBasicStats) {
    const date = fixture.kickoffAt.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    log.info(
      `   ⚠️  ${fixture.stageName} Round ${fixture.roundName} | ${fixture.homeTeam} vs ${fixture.awayTeam} | ${date}`
    );
  }

  const squadMemberships = await db.squadMembership.findMany({
    where: { seasonId: targetSeason.id },
    select: { playerId: true, teamId: true, shirtNumber: true, player: { select: { id: true, name: true } } },
  });

  const playersByTeamId = new Map<number, PlayerCandidate[]>();
  for (const sm of squadMemberships) {
    const list = playersByTeamId.get(sm.teamId) ?? [];
    list.push({ id: sm.player.id, name: sm.player.name, shirtNumber: sm.shirtNumber });
    playersByTeamId.set(sm.teamId, list);
  }

  log.info("🌐 Launching browser...");
  const { browser, page } = await createBrowser();

  try {
    const seasonId = await findExternalSeasonId(page, targetSeason.name, log);
    if (!seasonId) {
      log.error("❌ Could not find season on external source.");
      return;
    }
    log.info(`📅 External source season ID: ${seasonId}`);

    const eventsByKey = new Map<string, ExternalEvent[]>();
    let filledFixtures = 0;
    let insertedStats = 0;
    let unmatchedPlayers = 0;

    for (const fixture of fixturesWithBasicStats) {
      const roundName = fixture.roundName;
      const cacheKey = `${fixture.stageName}::${roundName}`;

      if (!eventsByKey.has(cacheKey)) {
        const events = await findExternalEvents(page, seasonId, roundName, fixture.stageName, log);
        eventsByKey.set(cacheKey, events);
        log.info(`📥 ${fixture.stageName} Round ${roundName}: ${events.length} events fetched`);
      }

      const events = eventsByKey.get(cacheKey) ?? [];
      const matchedEvent = matchFixtureToEvent(
        fixture.homeTeam,
        fixture.awayTeam,
        fixture.kickoffAt,
        events
      );

      if (!matchedEvent) {
        log.warn(
          `⚠️  No match found for ${fixture.homeTeam} vs ${fixture.awayTeam} (Round ${roundName})`
        );
        continue;
      }

      log.info(
        `🔗 Matched: ${fixture.homeTeam} vs ${fixture.awayTeam} → event ${matchedEvent.id}`
      );

      const lineups = await fetchJson<ExternalLineups>(
        page,
        `/api/v1/event/${matchedEvent.id}/lineups`,
        log,
      );

      if (!lineups || !lineups.home?.players?.length || !lineups.away?.players?.length) {
        log.warn(`⚠️  No lineups available for ${fixture.homeTeam} vs ${fixture.awayTeam} (event ${matchedEvent.id})`);
        continue;
      }

      // Load lineup jersey numbers for this fixture to help with matching
      const fixtureLineups = await db.lineup.findMany({
        where: { fixtureId: fixture.fixtureId },
        select: { playerId: true, jerseyNumber: true },
      });
      const jerseyByPlayerId = new Map(
        fixtureLineups.map((l) => [l.playerId, l.jerseyNumber])
      );

      const statsBatch: {
        sportmonksId: null;
        fixtureId: number;
        playerId: number;
        typeId: number;
        value: number;
      }[] = [];

      const teamIdBySide = {
        home: fixture.homeTeamId,
        away: fixture.awayTeamId,
      };

      for (const side of ["home", "away"] as const) {
        const players = lineups[side].players;
        const basePlayers = playersByTeamId.get(teamIdBySide[side]) ?? [];

        // Enrich squad players with jersey numbers from lineup, falling back to squad shirt number
        const teamPlayers: PlayerCandidate[] = basePlayers.map((p) => ({
          ...p,
          jerseyNumber: jerseyByPlayerId.get(p.id) ?? p.shirtNumber,
        }));

        for (const extPlayer of players) {
          const stats = extPlayer.statistics;
          if (!stats) continue;

          // Check if the player has at least one stat that maps to our schema
          const hasMappableStat = Object.keys(stats).some((key) => key in EXTERNAL_TO_STAT_TYPE);
          if (!hasMappableStat) continue;

          const extJersey = extPlayer.jerseyNumber ? parseInt(extPlayer.jerseyNumber, 10) : null;
          let playerId = matchPlayer(extPlayer.player.name, teamPlayers, extJersey);
          if (!playerId) {
            // Player not in DB — create from SoFaScore data
            const teamId = teamIdBySide[side];
            const newPlayer = await db.player.create({
              data: { name: extPlayer.player.name, sportmonksId: null },
              select: { id: true },
            });
            await db.squadMembership.create({
              data: {
                playerId: newPlayer.id,
                teamId,
                seasonId: targetSeason.id,
                shirtNumber: extJersey,
                from: new Date(),
              },
            });
            const newCandidate: PlayerCandidate = {
              id: newPlayer.id,
              name: extPlayer.player.name,
              shirtNumber: extJersey,
              jerseyNumber: extJersey,
            };
            teamPlayers.push(newCandidate);
            const teamList = playersByTeamId.get(teamId) ?? [];
            teamList.push({ id: newPlayer.id, name: extPlayer.player.name, shirtNumber: extJersey });
            playersByTeamId.set(teamId, teamList);
            playerId = newPlayer.id;
            log.info(`⚠️  Created from external source: ${extPlayer.player.name} #${extJersey ?? "?"} (${side})`);
          }

          for (const [extKey, typeId] of Object.entries(EXTERNAL_TO_STAT_TYPE)) {
            const rawValue = stats[extKey];
            if (rawValue == null || typeof rawValue !== "number") continue;

            statsBatch.push({
              sportmonksId: null,
              fixtureId: fixture.fixtureId,
              playerId,
              typeId,
              value: rawValue,
            });
          }
        }
      }

      if (statsBatch.length > 0) {
        await db.$transaction(async (tx) => {
          await tx.fixturePlayerStatistic.deleteMany({
            where: { fixtureId: fixture.fixtureId },
          });
          await tx.fixturePlayerStatistic.createMany({ data: statsBatch });

          // Enrich card stats from Events table (SoFaScore doesn't provide cards)
          const cardEvents = await tx.event.findMany({
            where: {
              fixtureId: fixture.fixtureId,
              typeId: { in: [19, 20, 21] }, // yellow, red, yellow-red
              playerId: { not: null },
            },
            select: { playerId: true, typeId: true },
          });

          if (cardEvents.length > 0) {
            const cardCounts = new Map<string, { playerId: number; statTypeId: number; count: number }>();
            for (const event of cardEvents) {
              const statTypeId = event.typeId === 19 ? 84 : event.typeId === 20 ? 83 : 85;
              const key = `${event.playerId}:${statTypeId}`;
              const existing = cardCounts.get(key);
              if (existing) {
                existing.count += 1;
              } else {
                cardCounts.set(key, { playerId: event.playerId!, statTypeId, count: 1 });
              }
            }

            const cardStats = Array.from(cardCounts.values()).map((entry) => ({
              sportmonksId: null as null,
              fixtureId: fixture.fixtureId,
              playerId: entry.playerId,
              typeId: entry.statTypeId,
              value: entry.count,
            }));

            await tx.fixturePlayerStatistic.createMany({ data: cardStats });
          }
        });

        filledFixtures++;
        insertedStats += statsBatch.length;
        log.info(
          `✅ ${fixture.homeTeam} vs ${fixture.awayTeam}: ${statsBatch.length} stats filled`
        );
      } else {
        log.warn(
          `⚠️  No stats generated for ${fixture.homeTeam} vs ${fixture.awayTeam} — external source may lack data`
        );
      }
    }

    log.info("✅ Fill stats summary");
    log.info(`🟢 Filled fixtures: ${filledFixtures}/${fixturesWithBasicStats.length}`);
    log.info(`🟢 Stats inserted: ${insertedStats}`);
    if (unmatchedPlayers > 0) {
      log.info(`🟡 Unmatched players: ${unmatchedPlayers}`);
    }
  } finally {
    await browser.close();
    log.info("🌐 Browser closed");
  }

  log.info("=== FILL STATS END ===");
}

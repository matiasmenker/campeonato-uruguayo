import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../../.env") });

import { chromium } from "playwright";

const BASE = process.env["EXTERNAL_STATS_URL"] ?? "https://www.sofascore.com";

async function fetchJson(page: any, endpoint: string): Promise<any> {
  try {
    return await page.evaluate(async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    }, BASE + endpoint);
  } catch {
    return null;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });

  // 1. Get the specific event details
  console.log("=== Event 13108787 ===");
  const eventData = await fetchJson(page, "/api/v1/event/13108787");
  const evt = eventData?.event;
  console.log(JSON.stringify({
    id: evt?.id,
    homeTeam: { id: evt?.homeTeam?.id, name: evt?.homeTeam?.name },
    awayTeam: { id: evt?.awayTeam?.id, name: evt?.awayTeam?.name },
    startTimestamp: evt?.startTimestamp,
    startDate: evt?.startTimestamp ? new Date(evt.startTimestamp * 1000).toISOString() : null,
    roundInfo: evt?.roundInfo,
    season: { id: evt?.season?.id, year: evt?.season?.year },
    tournament: evt?.tournament?.id,
    status: evt?.status,
  }, null, 2));

  // 2. Get seasons for tournament 278 to find SoFaScore season ID
  console.log("\n=== Seasons for tournament 278 ===");
  const seasonsData = await fetchJson(page, "/api/v1/unique-tournament/278/seasons");
  const recentSeasons = seasonsData?.seasons?.slice(0, 5);
  console.log(JSON.stringify(recentSeasons, null, 2));

  // 3. Try fetching events for round 13, Clausura, season ID from event above
  if (evt?.season?.id) {
    const seasonId = evt.season.id;
    console.log(`\n=== Events for round 13, Clausura, season ${seasonId} ===`);
    const eventsData = await fetchJson(page, `/api/v1/unique-tournament/278/season/${seasonId}/events/round/13/prefix/Clausura`);
    const events = eventsData?.events ?? [];
    console.log(`Total events: ${events.length}`);
    for (const e of events) {
      const date = new Date(e.startTimestamp * 1000).toISOString().split("T")[0];
      console.log(`  id=${e.id} | ${e.homeTeam.name} vs ${e.awayTeam.name} | ${date}`);
    }

    // 4. Check lineups for this event
    console.log("\n=== Lineups for event 13108787 ===");
    const lineups = await fetchJson(page, "/api/v1/event/13108787/lineups");
    console.log(`home players: ${lineups?.home?.players?.length ?? 0}`);
    console.log(`away players: ${lineups?.away?.players?.length ?? 0}`);
    if (lineups?.home?.players?.length > 0) {
      const sample = lineups.home.players[0];
      console.log("Sample home player:", JSON.stringify({
        name: sample?.player?.name,
        jerseyNumber: sample?.jerseyNumber,
        statsKeys: sample?.statistics ? Object.keys(sample.statistics) : []
      }));
    }
  }

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });

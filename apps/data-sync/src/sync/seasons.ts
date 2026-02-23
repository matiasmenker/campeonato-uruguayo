import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import type { SeasonRaw } from "sportmonks-client";

export interface SyncSeasonsDeps {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
  /** If set, only sync seasons for this league (sportmonks id). Otherwise sync from /seasons. */
  leagueId?: number;
  /** If set, only sync last N seasons per league. */
  lastN?: number;
}

export async function syncSeasons({
  client,
  db,
  log,
  leagueId,
  lastN = 4,
}: SyncSeasonsDeps): Promise<void> {
  const ctx = log.child({ block: "seasons" });
  ctx.info("📅 Syncing seasons...");

  let items: SeasonRaw[];

  if (leagueId) {
    const leagueData = await client.get<{
      seasons?: { data: SeasonRaw[] } | SeasonRaw[];
    }>(`/leagues/${leagueId}`, { include: "seasons" });
    const seasons = leagueData?.seasons;
    const arr = Array.isArray(seasons)
      ? seasons
      : (seasons as { data: SeasonRaw[] } | undefined)?.data ?? [];
    const sorted = [...arr].sort(
      (a, b) => new Date(b.ending_at).getTime() - new Date(a.ending_at).getTime()
    );
    items = lastN > 0 ? sorted.slice(0, lastN) : sorted;
    ctx.info(`  📥 Got ${items.length} seasons for league ${leagueId}`);
  } else {
    items = await client.getAllPages<SeasonRaw>("/seasons", {
      filters: "populate",
      perPage: 50,
      onPage: (data, page) => {
        ctx.info(`  📥 Downloaded page ${page}: ${data.length} seasons`);
      },
    });
  }

  const leagueCache = new Map<number, number>();
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const s = items[i];
    const leagueSportmonksId = s.league_id ?? 0;
    if (!leagueCache.has(leagueSportmonksId)) {
      const league = await db.league.findFirst({
        where: { sportmonksId: leagueSportmonksId },
      });
      if (league) leagueCache.set(leagueSportmonksId, league.id);
    }
    const leagueId = leagueCache.get(leagueSportmonksId);
    if (!leagueId) {
      skipped += 1;
      continue;
    }

    const data = {
      leagueId,
      name: s.name,
      startingAt: new Date(s.starting_at),
      endingAt: new Date(s.ending_at),
    };
    await db.season.upsert({
      where: { sportmonksId: s.id },
      create: { sportmonksId: s.id, ...data },
      update: data,
    });
    if ((i + 1) % 25 === 0) {
      ctx.info(`  💾 Progress: ${i + 1}/${items.length} seasons`);
    }
  }

  if (skipped > 0) {
    ctx.warn(`  ⚠️ Skipped ${skipped} seasons (league not found)`);
  }
  ctx.info(`✅ Seasons: ${items.length - skipped} synced`);
}

import type { PrismaClient } from "db";
import type { SeasonRaw } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const mapSeason = (seasonDto: SeasonRaw, leagueId: number) => {
  return {
    sportmonksId: seasonDto.id,
    leagueId,
    name: seasonDto.name,
    isCurrent: seasonDto.is_current ?? false,
    startingAt: new Date(seasonDto.starting_at),
    endingAt: new Date(seasonDto.ending_at),
  };
};

const syncSeasons = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== SEASONS START ===");
  log.info("🚀 Syncing Seasons...");
  const currentYear = new Date().getUTCFullYear();
  const minYear = currentYear - 4;

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: {
      id: true,
      sportmonksId: true,
    },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Season sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const leagueResponse = await client.get<{
    seasons?: { data: SeasonRaw[] } | SeasonRaw[];
  }>(`/leagues/${uruguayLeague.sportmonksId}`, { include: "seasons" });

  const seasonsArray = leagueResponse?.seasons;
  const seasons = Array.isArray(seasonsArray) ? seasonsArray : (seasonsArray?.data ?? []);
  log.info(`📥 Seasons fetched from API: ${seasons.length}`);

  const seasonsToPersist = seasons
    .filter((season) => {
      if (!season.name || !season.starting_at || !season.ending_at) {
        log.warn(`⚠️  Season skipped: ${season.id}`);
        return false;
      }
      const endingYear = new Date(season.ending_at).getUTCFullYear();
      if (endingYear < minYear || endingYear > currentYear) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.ending_at).getTime() - new Date(a.ending_at).getTime());

  for (let i = 0; i < seasonsToPersist.length; i++) {
    const seasonDto = seasonsToPersist[i];
    const season = mapSeason(seasonDto, uruguayLeague.id);

    await db.season.upsert({
      where: { sportmonksId: season.sportmonksId },
      create: season,
      update: season,
    });

    const processed = i + 1;
    if (processed % 25 === 0 || processed === seasonsToPersist.length) {
      log.info(`💾 Progress: ${processed}/${seasonsToPersist.length} seasons`);
    }
  }

  const skippedSeasons = seasons.length - seasonsToPersist.length;
  const totalRows = await db.season.count();
  const currentRows = await db.season.count({ where: { isCurrent: true } });
  log.info("✅ Seasons sync summary");
  log.info(`🗓️ Window: ${minYear}-${currentYear}`);
  log.info(`🟢 Saved (inserted/updated): ${seasonsToPersist.length}`);
  log.info(`🟡 Skipped: ${skippedSeasons}`);
  log.info(`🔵 Current rows (isCurrent=true): ${currentRows}`);
  log.info(`📦 Total rows in Season table: ${totalRows}`);
  log.info("=== SEASONS END ===");
};

export { syncSeasons };

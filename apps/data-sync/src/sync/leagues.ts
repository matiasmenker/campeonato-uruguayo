import type { LeagueDto } from "sportmonks-client";
import type { SyncDependencies } from "./shared.js";

const mapLeague = (leagueDto: LeagueDto, countryId: number | null) => {
  return {
    sportmonksId: leagueDto.id,
    name: leagueDto.name,
    shortCode: leagueDto.short_code ?? null,
    imagePath: leagueDto.image_path ?? null,
    countryId,
  };
};

const syncLeagues = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== LEAGUES START ===");
  log.info("🚀 Syncing Leagues...");

  const leaguesResponse = await client.getAllPages<LeagueDto>("/leagues", {
    perPage: 50,
  });

  log.info(`📥 Leagues fetched from API: ${leaguesResponse.length}`);

  const leaguesToPersist = leaguesResponse.filter((league) => {
    if (!league.name) {
      log.warn(`⚠️  League skipped: ${league.id}`);
      return false;
    }
    return true;
  });

  for (let i = 0; i < leaguesToPersist.length; i++) {
    const leagueDto = leaguesToPersist[i];
    const countrySportmonksId = leagueDto.country_id ?? null;
    const country = countrySportmonksId
      ? await db.country.findUnique({ where: { sportmonksId: countrySportmonksId } })
      : null;
    const countryId = country?.id ?? null;
    const league = mapLeague(leagueDto, countryId);

    await db.league.upsert({
      where: { sportmonksId: league.sportmonksId },
      create: league,
      update: league,
    });

    const processed = i + 1;
    if (processed % 25 === 0 || processed === leaguesToPersist.length) {
      log.info(`💾 Progress: ${processed}/${leaguesToPersist.length} leagues`);
    }
  }

  const savedLeagues = leaguesToPersist.length;
  const skippedLeagues = leaguesResponse.length - leaguesToPersist.length;
  const totalRows = await db.league.count();
  log.info("✅ Leagues sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedLeagues}`);
  log.info(`🟡 Skipped: ${skippedLeagues}`);
  log.info(`📦 Total rows in League table: ${totalRows}`);
  log.info("=== LEAGUES END ===");
};

export { syncLeagues };

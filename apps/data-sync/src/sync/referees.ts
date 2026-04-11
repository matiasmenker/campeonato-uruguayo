import type { RefereeDto } from "sportmonks-client";
import type { SyncDependencies, SyncOptions } from "./shared.js";

const syncReferees = async (
  { client, db, log }: SyncDependencies,
  options?: SyncOptions
): Promise<void> => {
  log.info("=== REFEREES START ===");
  log.info("🚀 Syncing Referees...");

  const uruguayLeague = await db.league.findFirst({
    where: { country: { code: "UY" } },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Referee sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: {
      leagueId: uruguayLeague.id,
      ...(options?.seasonSportmonksIds
        ? { sportmonksId: { in: options.seasonSportmonksIds } }
        : {}),
    },
    select: { sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Referee sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  let savedReferees = 0;
  let skippedReferees = 0;
  let duplicateReferees = 0;
  const seenRefereeSportmonksIds = new Set<number>();

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const referees = await client.getAllPages<RefereeDto>(
      `/referees/seasons/${season.sportmonksId}`,
      {
        perPage: 50,
      }
    );
    log.info(`📥 Referees fetched from API (${season.sportmonksId}): ${referees.length}`);

    for (let j = 0; j < referees.length; j++) {
      const referee = referees[j];

      if (referee.id == null || !referee.name?.trim()) {
        skippedReferees += 1;
        continue;
      }

      if (seenRefereeSportmonksIds.has(referee.id)) {
        duplicateReferees += 1;
        continue;
      }
      seenRefereeSportmonksIds.add(referee.id);

      await db.referee.upsert({
        where: { sportmonksId: referee.id },
        create: {
          sportmonksId: referee.id,
          name: referee.name.trim(),
          imagePath: referee.image_path?.trim() || null,
        },
        update: {
          name: referee.name.trim(),
          imagePath: referee.image_path?.trim() || null,
        },
      });
      savedReferees += 1;

      const refereeProgress = j + 1;
      if (refereeProgress % 25 === 0 || refereeProgress === referees.length) {
        log.info(
          `💾 Season progress (${season.sportmonksId}): ${refereeProgress}/${referees.length} referees`
        );
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.referee.count();
  log.info("✅ Referees sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedReferees}`);
  log.info(`🟡 Skipped: ${skippedReferees}`);
  log.info(`🟡 Duplicates ignored: ${duplicateReferees}`);
  log.info(`📦 Total rows in Referee table: ${totalRows}`);
  log.info("=== REFEREES END ===");
};

export { syncReferees };

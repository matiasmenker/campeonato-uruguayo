import type { SyncDependencies, SyncOptions } from "./shared.js";
import { syncSeasons } from "./seasons.js";
import { syncStructure } from "./structure.js";
import { syncVenues } from "./venues.js";
import { syncReferees } from "./referees.js";
import { syncPlayers } from "./players.js";
import { syncSquadMemberships } from "./squad-memberships.js";
import { syncCoaches } from "./coaches.js";
import { syncTransfers } from "./transfers.js";
import { syncSidelined } from "./sidelined.js";
import { syncFixtures } from "./fixtures.js";
import { syncFixtureDetails } from "./fixture-details.js";
import { syncStandings } from "./standings.js";
import { syncFillStats } from "./fill-stats.js";

export async function syncDaily(dependencies: SyncDependencies): Promise<void> {
  const { db, log } = dependencies;
  log.info("=== DAILY SYNC START ===");
  const startTime = Date.now();

  await syncSeasons(dependencies);

  const currentSeason = await db.season.findFirst({
    where: { isCurrent: true },
    select: { sportmonksId: true, name: true },
  });

  if (!currentSeason) {
    log.warn("⚠️  Daily sync aborted: no current season found.");
    return;
  }

  log.info(`📅 Current season: ${currentSeason.name} (${currentSeason.sportmonksId})`);

  const currentSeasonFilter: SyncOptions = {
    seasonSportmonksIds: [currentSeason.sportmonksId],
  };

  await syncStructure(dependencies, currentSeasonFilter);
  await syncVenues(dependencies);
  await syncReferees(dependencies, currentSeasonFilter);
  await syncPlayers(dependencies, currentSeasonFilter);
  await syncSquadMemberships(dependencies, currentSeasonFilter);
  await syncCoaches(dependencies, currentSeasonFilter);
  await syncTransfers(dependencies, currentSeasonFilter);
  await syncSidelined(dependencies, currentSeasonFilter);
  await syncFixtures(dependencies, currentSeasonFilter);
  await syncFixtureDetails(dependencies, currentSeasonFilter);
  await syncStandings(dependencies, currentSeasonFilter);

  await syncFillStats(dependencies);

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  log.info(`=== DAILY SYNC END (${elapsedSeconds}s) ===`);
}

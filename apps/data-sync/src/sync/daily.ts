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

/**
 * Daily sync: updates only the current season.
 *
 * Reuses the same modular sync functions used by sync:base,
 * scoped to a single season via SyncOptions.seasonSportmonksIds.
 *
 * Steps:
 *  1. Seasons        — detect isCurrent changes
 *  2. Structure      — stages, rounds, groups
 *  3. Venues         — global (no season scope)
 *  4. Referees       — current season only
 *  5. Players        — current season only
 *  6. Squad members  — current season only
 *  7. Coaches        — current season only
 *  8. Transfers      — current season only
 *  9. Sidelined      — current season only
 * 10. Fixtures       — current season only
 * 11. Fixture details — current season only
 * 12. Standings      — current season only
 */
export async function syncDaily(dependencies: SyncDependencies): Promise<void> {
  const { db, log } = dependencies;
  log.info("=== DAILY SYNC START ===");
  const startTime = Date.now();

  // Step 1: Update seasons (detect isCurrent flag changes)
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

  // Steps 2-12: all scoped to current season
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

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  log.info(`=== DAILY SYNC END (${elapsedSeconds}s) ===`);
}

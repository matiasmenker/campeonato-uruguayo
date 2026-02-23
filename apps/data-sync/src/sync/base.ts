import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import { syncCountries } from "./countries.js";
import { syncLeagues } from "./leagues.js";
import { syncVenues } from "./venues.js";
import { syncSeasons } from "./seasons.js";
import { syncStructure } from "./structure.js";

export interface SyncBaseDeps {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
  leagueId?: number;
  lastSeasons?: number;
}

/**
 * Sync base entities: countries → leagues → venues (with cities) → seasons → structure.
 * Order respects dependencies.
 */
export async function syncBase({
  client,
  db,
  log,
  leagueId,
  lastSeasons = 4,
}: SyncBaseDeps): Promise<void> {
  log.info("🚀 Starting sync:base (countries, leagues, venues, seasons, structure)");
  await syncCountries({ client, db, log });
  await syncLeagues({ client, db, log });
  await syncVenues({ client, db, log });
  await syncSeasons({ client, db, log, leagueId, lastN: lastSeasons });
  await syncStructure({ client, db, log });
  log.info("🎉 Sync Finished successfully");
}

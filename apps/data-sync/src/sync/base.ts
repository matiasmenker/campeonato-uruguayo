import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import { syncCountries } from "./countries.js";
import { syncLeagues } from "./leagues.js";
import { syncSeasons } from "./seasons.js";
import { syncVenues } from "./venues.js";

export interface SyncBaseDeps {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

export async function syncBase({ client, db, log }: SyncBaseDeps): Promise<void> {
  log.info("🚀 Starting sync:base");
  await syncCountries({ client, db, log });
  await syncLeagues({ client, db, log });
  await syncSeasons({ client, db, log });
  await syncVenues({ client, db, log });
  log.info("🎉 Sync Finished Successfully");
}

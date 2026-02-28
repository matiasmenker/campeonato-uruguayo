import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import { syncCountries } from "./countries.js";
import { syncTypes } from "./types.js";
import { syncLeagues } from "./leagues.js";
import { syncSeasons } from "./seasons.js";
import { syncVenues } from "./venues.js";
import { syncStructure } from "./structure.js";
import { syncTeams } from "./teams.js";
import { syncPlayers } from "./players.js";
import { syncSquadMemberships } from "./squad-memberships.js";
import { syncStates } from "./states.js";
import { syncFixtures } from "./fixtures.js";
import { syncFixtureDetails } from "./fixture-details.js";

export interface SyncBaseDeps {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

export async function syncBase({ client, db, log }: SyncBaseDeps): Promise<void> {
  log.info("🚀 Starting sync:base");
  await syncCountries({ client, db, log });
  await syncTypes({ client, db, log });
  await syncLeagues({ client, db, log });
  await syncSeasons({ client, db, log });
  await syncVenues({ client, db, log });
  await syncStructure({ client, db, log });
  await syncTeams({ client, db, log });
  await syncPlayers({ client, db, log });
  await syncSquadMemberships({ client, db, log });
  await syncStates({ client, db, log });
  await syncFixtures({ client, db, log });
  await syncFixtureDetails({ client, db, log });
  log.info("🎉 Sync Finished Successfully");
}

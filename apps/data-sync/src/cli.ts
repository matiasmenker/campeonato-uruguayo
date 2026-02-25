#!/usr/bin/env node
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });

import { PrismaClient } from "db";
import { createLogger } from "./logger.js";
import { createClient } from "./sportmonks.js";
import { syncBase } from "./sync/base.js";
import { syncCountries } from "./sync/countries.js";
import { syncLeagues } from "./sync/leagues.js";
import { syncSeasons } from "./sync/seasons.js";
import { syncVenues } from "./sync/venues.js";
import { syncStructure } from "./sync/structure.js";
import { syncTeams } from "./sync/teams.js";

const log = createLogger("data-sync");

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    log.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "sync:base";

  const db = new PrismaClient();
  const apiToken = getEnv("SPORTMONKS_API_TOKEN");
  const client = createClient(apiToken);

  try {
    switch (command) {
      case "sync:base": {
        await syncBase({
          client,
          db,
          log,
        });
        break;
      }
      case "sync:countries":
        await syncCountries({ client, db, log });
        break;
      case "sync:leagues":
        await syncLeagues({ client, db, log });
        break;
      case "sync:seasons":
        await syncSeasons({ client, db, log });
        break;
      case "sync:venues":
        await syncVenues({ client, db, log });
        break;
      case "sync:structure":
        await syncStructure({ client, db, log });
        break;
      case "sync:teams":
        await syncTeams({ client, db, log });
        break;
      case "sync":
        await syncBase({ client, db, log });
        break;
      default:
        log.error(
          `Unknown command: ${command}. Use one of: sync, sync:base, sync:countries, sync:leagues, sync:venues, sync:seasons, sync:structure, sync:teams`
        );
        process.exit(1);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  log.error("Fatal error", { err: String(err) });
  process.exit(1);
});

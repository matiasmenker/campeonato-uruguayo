import type { PrismaClient } from "db";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

export interface SyncOptions {
  /** When provided, only these SportMonks season IDs are processed. */
  seasonSportmonksIds?: number[];
}

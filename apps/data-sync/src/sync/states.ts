import type { FixtureStateDto } from "sportmonks-client";
import type { SyncDependencies } from "./shared.js";

const syncStates = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== STATES START ===");
  log.info("🚀 Syncing States...");

  const states = await client.getAllPages<FixtureStateDto>("/states", {
    perPage: 100,
  });
  log.info(`📥 States fetched from API: ${states.length}`);

  let savedStates = 0;
  let skippedStates = 0;

  for (let i = 0; i < states.length; i++) {
    const stateDto = states[i];
    const name = stateDto.name?.trim();

    if (!name) {
      skippedStates += 1;
      continue;
    }

    await db.fixtureState.upsert({
      where: { id: stateDto.id },
      create: {
        id: stateDto.id,
        state: stateDto.state?.trim() || null,
        name,
        shortName: stateDto.short_name?.trim() || null,
        developerName: stateDto.developer_name?.trim() || null,
      },
      update: {
        state: stateDto.state?.trim() || null,
        name,
        shortName: stateDto.short_name?.trim() || null,
        developerName: stateDto.developer_name?.trim() || null,
      },
    });
    savedStates += 1;
  }

  const totalRows = await db.fixtureState.count();
  log.info("✅ States sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedStates}`);
  log.info(`🟡 Skipped: ${skippedStates}`);
  log.info(`📦 Total rows in FixtureState table: ${totalRows}`);
  log.info("=== STATES END ===");
};

export { syncStates };

import type { TypeDto } from "sportmonks-client";
import type { SyncDependencies } from "./shared.js";

const syncTypes = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== TYPES START ===");
  log.info("🚀 Syncing Types...");

  const types = await client.getAllPages<TypeDto>("https://api.sportmonks.com/v3/core/types", {
    perPage: 100,
    filters: "populate",
  });
  log.info(`📥 Types fetched from API: ${types.length}`);

  let savedTypes = 0;
  let skippedTypes = 0;
  const rows: Array<{
    id: number;
    name: string;
    developerName: string | null;
    modelType: string | null;
    statGroup: string | null;
  }> = [];

  for (let i = 0; i < types.length; i++) {
    const typeDto = types[i];
    const typeName = typeDto.name?.trim();
    if (!typeName) {
      skippedTypes += 1;
      continue;
    }

    rows.push({
      id: typeDto.id,
      name: typeName,
      developerName: typeDto.developer_name?.trim() || null,
      modelType: typeDto.model_type?.trim() || null,
      statGroup: typeDto.stat_group?.trim() || null,
    });
  }
  log.info(`💾 Prepared rows: ${rows.length}/${types.length} types`);

  await db.$transaction(async (tx) => {
    await tx.statType.deleteMany({});
    if (rows.length > 0) {
      await tx.statType.createMany({ data: rows });
    }
  });
  savedTypes = rows.length;

  const totalRows = await db.statType.count();
  log.info("✅ Types sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedTypes}`);
  log.info(`🟡 Skipped: ${skippedTypes}`);
  log.info(`📦 Total rows in StatType table: ${totalRows}`);
  log.info("=== TYPES END ===");
};

export { syncTypes };

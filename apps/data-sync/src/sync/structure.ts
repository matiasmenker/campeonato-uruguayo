import type { PrismaClient } from "db";
import type { SportMonksClient } from "../sportmonks.js";
import type { Logger } from "../logger.js";
import type { StageRaw, RoundRaw, GroupRaw } from "sportmonks-client";

export interface SyncStructureDeps {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
  /** Season sportmonks IDs to sync. If empty, sync all seasons in DB. */
  seasonIds?: number[];
}

function extractArray<T>(raw: { data: T[] } | T[] | undefined): T[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.data ?? [];
}

export async function syncStructure({
  client,
  db,
  log,
  seasonIds: filterSeasonIds,
}: SyncStructureDeps): Promise<void> {
  const ctx = log.child({ block: "structure" });
  ctx.info("🏗️ Syncing structure (stages, rounds, groups)...");

  const seasons = await db.season.findMany({
    where: filterSeasonIds?.length
      ? { sportmonksId: { in: filterSeasonIds } }
      : undefined,
  });

  if (seasons.length === 0) {
    ctx.warn("  ⚠️ No seasons found. Run sync:base or sync:seasons first.");
    return;
  }

  let stagesCreated = 0;
  let stagesUpdated = 0;
  let roundsCreated = 0;
  let roundsUpdated = 0;
  let groupsCreated = 0;
  let groupsUpdated = 0;

  for (const season of seasons) {
    const seasonData = await client.get<{
      stages?: { data: StageRaw[] } | StageRaw[];
    }>(`/seasons/${season.sportmonksId}`, { include: "stages" });

    const stages = extractArray(seasonData?.stages);

    for (const st of stages) {
      const existing = await db.stage.findUnique({ where: { sportmonksId: st.id } });
      const data = {
        seasonId: season.id,
        name: st.name,
        type: st.type ?? null,
      };
      if (existing) {
        await db.stage.update({ where: { id: existing.id }, data });
        stagesUpdated += 1;
      } else {
        await db.stage.create({ data: { sportmonksId: st.id, ...data } });
        stagesCreated += 1;
      }
    }

    const roundsResponse = await client.get<RoundRaw[] | { data: RoundRaw[] }>(
      `/rounds/seasons/${season.sportmonksId}`
    );
    const rounds = extractArray(roundsResponse);

    for (const r of rounds) {
      const stageSportmonksId = r.stage_id;
      if (!stageSportmonksId) continue;
      const stage = await db.stage.findUnique({
        where: { sportmonksId: stageSportmonksId },
      });
      if (!stage) continue;

      const ex = await db.round.findUnique({ where: { sportmonksId: r.id } });
      const rData = {
        stageId: stage.id,
        name: r.name,
        slug: r.slug ?? null,
      };
      if (ex) {
        await db.round.update({ where: { id: ex.id }, data: rData });
        roundsUpdated += 1;
      } else {
        await db.round.create({ data: { sportmonksId: r.id, ...rData } });
        roundsCreated += 1;
      }
    }

    try {
      const seasonWithGroups = await client.get<{
        groups?: { data: GroupRaw[] } | GroupRaw[];
      }>(`/seasons/${season.sportmonksId}`, { include: "groups" });
      const groups = extractArray(seasonWithGroups?.groups);

      for (const g of groups) {
        const stageSportmonksId =
          g.stage_id ?? (g as { stage?: { id: number } }).stage?.id;
        if (!stageSportmonksId) continue;
        const stage = await db.stage.findUnique({
          where: { sportmonksId: stageSportmonksId },
        });
        if (!stage) continue;

        const ex = await db.group.findUnique({ where: { sportmonksId: g.id } });
        const gData = {
          stageId: stage.id,
          name: g.name ?? null,
        };
        if (ex) {
          await db.group.update({ where: { id: ex.id }, data: gData });
          groupsUpdated += 1;
        } else {
          await db.group.create({ data: { sportmonksId: g.id, ...gData } });
          groupsCreated += 1;
        }
      }
    } catch {
      ctx.warn(
        `  ⚠️ Groups not available for season ${season.sportmonksId} (many leagues have no groups)`
      );
    }
  }

  ctx.info(
    `✅ Structure: stages ${stagesCreated}+${stagesUpdated}, rounds ${roundsCreated}+${roundsUpdated}, groups ${groupsCreated}+${groupsUpdated}`
  );
}

import type { GroupDto, RoundDto, StageDto } from "sportmonks-client";
import type { SyncDependencies, SyncOptions } from "./shared.js";

const extractArray = <T>(raw: { data: T[] } | T[] | undefined): T[] => {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : (raw.data ?? []);
};

const syncStructure = async (
  { client, db, log }: SyncDependencies,
  options?: SyncOptions
): Promise<void> => {
  log.info("=== STRUCTURE START ===");
  log.info("🚀 Syncing Structure...");
  const currentYear = new Date().getUTCFullYear();
  const minYear = currentYear - 3;

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Structure sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: {
      leagueId: uruguayLeague.id,
      ...(options?.seasonSportmonksIds
        ? { sportmonksId: { in: options.seasonSportmonksIds } }
        : {
            endingAt: {
              gte: new Date(Date.UTC(minYear, 0, 1)),
              lt: new Date(Date.UTC(currentYear + 1, 0, 1)),
            },
          }),
    },
    select: { id: true, sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Structure sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  let savedStages = 0;
  let skippedStages = 0;
  let savedRounds = 0;
  let skippedRounds = 0;
  let savedGroups = 0;
  let skippedGroups = 0;

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const processed = i + 1;
    log.info(`🔎 Processing season ${processed}/${seasons.length}: ${season.sportmonksId}`);

    const seasonResponse = await client.get<{
      stages?: { data: StageDto[] } | StageDto[];
    }>(`/seasons/${season.sportmonksId}`, { include: "stages" });

    const stages = extractArray(seasonResponse?.stages);
    log.info(`📥 Stages fetched from API (${season.sportmonksId}): ${stages.length}`);
    const stageMap = new Map<number, number>();

    for (const stageDto of stages) {
      if (!stageDto.name) {
        skippedStages += 1;
        log.warn(`⚠️  Stage skipped: ${stageDto.id}`);
        continue;
      }

      const stage = await db.stage.upsert({
        where: { sportmonksId: stageDto.id },
        create: {
          sportmonksId: stageDto.id,
          seasonId: season.id,
          name: stageDto.name,
          type: stageDto.type ?? null,
          isCurrent: stageDto.is_current ?? false,
        },
        update: {
          seasonId: season.id,
          name: stageDto.name,
          type: stageDto.type ?? null,
          isCurrent: stageDto.is_current ?? false,
        },
      });
      stageMap.set(stageDto.id, stage.id);
      savedStages += 1;
    }

    const roundsResponse = await client.get<RoundDto[] | { data: RoundDto[] }>(
      `/rounds/seasons/${season.sportmonksId}`
    );
    const rounds = extractArray(roundsResponse);
    log.info(`📥 Rounds fetched from API (${season.sportmonksId}): ${rounds.length}`);

    for (const roundDto of rounds) {
      if (!roundDto.name || !roundDto.stage_id) {
        skippedRounds += 1;
        log.warn(`⚠️  Round skipped: ${roundDto.id}`);
        continue;
      }

      const stageId = stageMap.get(roundDto.stage_id);
      if (!stageId) {
        skippedRounds += 1;
        log.warn(`⚠️  Round skipped: ${roundDto.id}`);
        continue;
      }

      await db.round.upsert({
        where: { sportmonksId: roundDto.id },
        create: {
          sportmonksId: roundDto.id,
          stageId,
          name: roundDto.name,
          slug: roundDto.slug ?? null,
          isCurrent: roundDto.is_current ?? false,
        },
        update: {
          stageId,
          name: roundDto.name,
          slug: roundDto.slug ?? null,
          isCurrent: roundDto.is_current ?? false,
        },
      });
      savedRounds += 1;
    }

    try {
      const groupsResponse = await client.get<{
        groups?: { data: GroupDto[] } | GroupDto[];
      }>(`/seasons/${season.sportmonksId}`, { include: "groups" });
      const groups = extractArray(groupsResponse?.groups);
      log.info(`📥 Groups fetched from API (${season.sportmonksId}): ${groups.length}`);

      for (const groupDto of groups) {
        const stageSportmonksId =
          groupDto.stage_id ?? (groupDto as { stage?: { id: number } }).stage?.id;
        if (!stageSportmonksId) {
          skippedGroups += 1;
          log.warn(`⚠️  Group skipped: ${groupDto.id}`);
          continue;
        }

        const stageId = stageMap.get(stageSportmonksId);
        if (!stageId) {
          skippedGroups += 1;
          log.warn(`⚠️  Group skipped: ${groupDto.id}`);
          continue;
        }

        await db.group.upsert({
          where: { sportmonksId: groupDto.id },
          create: {
            sportmonksId: groupDto.id,
            stageId,
            name: groupDto.name ?? null,
          },
          update: {
            stageId,
            name: groupDto.name ?? null,
          },
        });
        savedGroups += 1;
      }
    } catch {
      log.warn(`⚠️  Groups skipped for season: ${season.sportmonksId}`);
    }

    log.info(`💾 Progress: ${processed}/${seasons.length} seasons`);
  }

  const totalStages = await db.stage.count();
  const totalRounds = await db.round.count();
  const totalGroups = await db.group.count();
  const currentStages = await db.stage.count({ where: { isCurrent: true } });
  const currentRounds = await db.round.count({ where: { isCurrent: true } });

  log.info("✅ Structure sync summary");
  log.info(`🗓️ Window: ${minYear}-${currentYear}`);
  log.info(
    `🟢 Saved (inserted/updated): stages=${savedStages}, rounds=${savedRounds}, groups=${savedGroups}`
  );
  log.info(`🟡 Skipped: stages=${skippedStages}, rounds=${skippedRounds}, groups=${skippedGroups}`);
  log.info(`🔵 Current rows (isCurrent=true): stages=${currentStages}, rounds=${currentRounds}`);
  log.info(`📦 Total rows: stages=${totalStages}, rounds=${totalRounds}, groups=${totalGroups}`);
  log.info("=== STRUCTURE END ===");
};

export { syncStructure };

import type { PrismaClient } from "db";
import type { PlayerDto, SidelinedDto, TeamWithSidelinedDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const classifySidelined = (row: SidelinedDto): "injury" | "suspension" => {
  const text = `${row.category ?? ""} ${row.type ?? ""} ${row.reason ?? ""}`.toLowerCase();
  if (text.includes("susp") || text.includes("ban")) return "suspension";
  return "injury";
};

const upsertPlayer = async (
  db: PrismaClient,
  playerIdBySportmonksId: Map<number, number>,
  player: PlayerDto | null | undefined,
  fallbackSportmonksId: number
): Promise<number> => {
  const sportmonksId = player?.id ?? fallbackSportmonksId;
  const existing = playerIdBySportmonksId.get(sportmonksId);
  if (existing != null) return existing;

  const persistedPlayer = await db.player.upsert({
    where: { sportmonksId },
    create: {
      sportmonksId,
      name: player?.name?.trim() || `Player ${sportmonksId}`,
      displayName: player?.display_name?.trim() || null,
      imagePath: player?.image_path?.trim() || null,
      positionId: player?.position_id ?? null,
    },
    update: player
      ? {
          name: player.name?.trim() || `Player ${sportmonksId}`,
          displayName: player.display_name?.trim() || null,
          imagePath: player.image_path?.trim() || null,
          positionId: player.position_id ?? null,
        }
      : {},
    select: { id: true },
  });
  playerIdBySportmonksId.set(sportmonksId, persistedPlayer.id);
  return persistedPlayer.id;
};

const syncSidelined = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== SIDELINED START ===");
  log.info("🚀 Syncing Sidelined (Injuries & Suspensions)...");

  const uruguayLeague = await db.league.findFirst({
    where: { country: { code: "UY" } },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Sidelined sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: { leagueId: uruguayLeague.id },
    select: { sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Sidelined sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  const playerRows = await db.player.findMany({ select: { id: true, sportmonksId: true } });
  const playerIdBySportmonksId = new Map(playerRows.map((player) => [player.sportmonksId, player.id]));

  let savedInjuries = 0;
  let savedSuspensions = 0;
  let skippedRows = 0;
  let duplicateRowsMerged = 0;
  const sampleSkippedRowIds: number[] = [];

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const teams = await client.getAllPages<TeamWithSidelinedDto>(`/teams/seasons/${season.sportmonksId}`, {
      perPage: 50,
      include: "sidelined.player;sidelinedHistory.player",
    });
    log.info(`📥 Teams fetched from API (${season.sportmonksId}): ${teams.length}`);

    for (let j = 0; j < teams.length; j++) {
      const team = teams[j];
      const teamProgress = j + 1;
      const currentRows = team.sidelined ?? [];
      const historyRows = team.sidelinedHistory ?? [];
      const sidelinedById = new Map<number, SidelinedDto>();

      for (let k = 0; k < currentRows.length; k++) {
        sidelinedById.set(currentRows[k].id, currentRows[k]);
      }
      for (let k = 0; k < historyRows.length; k++) {
        if (sidelinedById.has(historyRows[k].id)) {
          duplicateRowsMerged += 1;
        }
        sidelinedById.set(historyRows[k].id, historyRows[k]);
      }

      const sidelinedRows = Array.from(sidelinedById.values());

      for (let k = 0; k < sidelinedRows.length; k++) {
        const row = sidelinedRows[k];
        const playerSportmonksId = row.player_id ?? row.player?.id ?? null;
        if (row.id == null || playerSportmonksId == null) {
          skippedRows += 1;
          if (sampleSkippedRowIds.length < 20) {
            sampleSkippedRowIds.push(row.id);
          }
          continue;
        }

        const localPlayerId = await upsertPlayer(db, playerIdBySportmonksId, row.player, playerSportmonksId);

        const startDate = toDate(row.start_date ?? null);
        const endDate = toDate(row.end_date ?? null);
        const expectedReturn = toDate(row.expected_return ?? row.expected_at ?? null);
        const reason = row.reason?.trim() || null;
        const type = row.type?.trim() || row.category?.trim() || null;

        if (classifySidelined(row) === "suspension") {
          await db.suspension.upsert({
            where: { sportmonksId: row.id },
            create: {
              sportmonksId: row.id,
              playerId: localPlayerId,
              reason,
              startDate,
              endDate: endDate ?? expectedReturn,
            },
            update: {
              playerId: localPlayerId,
              reason,
              startDate,
              endDate: endDate ?? expectedReturn,
            },
          });
          await db.injury.deleteMany({ where: { sportmonksId: row.id } });
          savedSuspensions += 1;
        } else {
          await db.injury.upsert({
            where: { sportmonksId: row.id },
            create: {
              sportmonksId: row.id,
              playerId: localPlayerId,
              type,
              reason,
              startDate,
              expectedReturn: expectedReturn ?? endDate,
            },
            update: {
              playerId: localPlayerId,
              type,
              reason,
              startDate,
              expectedReturn: expectedReturn ?? endDate,
            },
          });
          await db.suspension.deleteMany({ where: { sportmonksId: row.id } });
          savedInjuries += 1;
        }
      }

      if (teamProgress % 10 === 0 || teamProgress === teams.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${teamProgress}/${teams.length} teams`);
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalInjuries = await db.injury.count();
  const totalSuspensions = await db.suspension.count();
  log.info("✅ Sidelined sync summary");
  log.info(`🟢 Saved (inserted/updated): injuries=${savedInjuries}, suspensions=${savedSuspensions}`);
  log.info(`🟡 Skipped: ${skippedRows}`);
  log.info(`🟡 Duplicate rows merged: ${duplicateRowsMerged}`);
  if (sampleSkippedRowIds.length > 0) {
    log.warn(`⚠️  Sample skipped sidelined IDs: ${sampleSkippedRowIds.join(", ")}`);
  }
  log.info(`📦 Total rows: injuries=${totalInjuries}, suspensions=${totalSuspensions}`);
  log.info("=== SIDELINED END ===");
};

export { syncSidelined };


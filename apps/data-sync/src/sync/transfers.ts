import type { PrismaClient } from "db";
import type { PlayerDto, TeamDto, TransferDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

interface TransferRow {
  sportmonksId: number;
  playerId: number;
  fromTeamId: number | null;
  toTeamId: number | null;
  type: string | null;
  date: Date | null;
  amount: string | null;
}

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const asString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "object" && value != null) {
    const record = value as Record<string, unknown>;
    if (typeof record.name === "string" && record.name.trim().length > 0) {
      return record.name.trim();
    }
  }
  return null;
};

const syncTransfers = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== TRANSFERS START ===");
  log.info("🚀 Syncing Transfers...");

  const currentYear = new Date().getUTCFullYear();
  const minYear = currentYear - 4;
  const minDate = new Date(Date.UTC(minYear, 0, 1));
  const maxDateExclusive = new Date(Date.UTC(currentYear + 1, 0, 1));
  const TEAM_FETCH_CONCURRENCY = 3;
  const CREATE_BATCH_SIZE = 1000;
  const UPSERT_BATCH_SIZE = 25;
  const RECENT_UPDATE_DAYS = 60;

  const uruguayLeague = await db.league.findFirst({
    where: { country: { code: "UY" } },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Transfer sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: {
      leagueId: uruguayLeague.id,
      endingAt: {
        gte: new Date(Date.UTC(minYear, 0, 1)),
        lt: new Date(Date.UTC(currentYear + 1, 0, 1)),
      },
    },
    select: { id: true, sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Transfer sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  const seasonIds = seasons.map((season) => season.id);
  const membershipRows = await db.squadMembership.findMany({
    where: { seasonId: { in: seasonIds } },
    select: {
      team: {
        select: {
          sportmonksId: true,
        },
      },
    },
    distinct: ["teamId"],
  });
  const trackedTeamSportmonksIds = membershipRows
    .map((row) => row.team.sportmonksId)
    .filter((value): value is number => value != null);

  if (trackedTeamSportmonksIds.length === 0) {
    log.warn("⚠️  Transfer sync skipped: no league teams found in SquadMembership. Run sync:squad-memberships first.");
    return;
  }

  log.info(`📥 Teams in scope (Uruguay seasons): ${trackedTeamSportmonksIds.length}`);

  const transferBySportmonksId = new Map<number, TransferDto>();
  let fetchedTransferRows = 0;
  for (let i = 0; i < trackedTeamSportmonksIds.length; i += TEAM_FETCH_CONCURRENCY) {
    const teamBatch = trackedTeamSportmonksIds.slice(i, i + TEAM_FETCH_CONCURRENCY);
    const batchTransfers = await Promise.all(
      teamBatch.map((teamSportmonksId) =>
        client.getAllPages<TransferDto>(`/transfers/teams/${teamSportmonksId}`, {
          perPage: 50,
          include: "player;fromTeam;toTeam",
        })
      )
    );

    for (let batchIndex = 0; batchIndex < batchTransfers.length; batchIndex++) {
      const teamTransfers = batchTransfers[batchIndex];
      fetchedTransferRows += teamTransfers.length;
      for (let j = 0; j < teamTransfers.length; j++) {
        const transfer = teamTransfers[j];
        transferBySportmonksId.set(transfer.id, transfer);
      }
    }

    const teamProgress = Math.min(i + TEAM_FETCH_CONCURRENCY, trackedTeamSportmonksIds.length);
    if (teamProgress % 5 === 0 || teamProgress === trackedTeamSportmonksIds.length) {
      log.info(`💾 Team progress: ${teamProgress}/${trackedTeamSportmonksIds.length} teams`);
    }
  }

  const dedupedTransfers = Array.from(transferBySportmonksId.values());
  let missingDateTransfers = 0;
  const scopedTransfers = dedupedTransfers.filter((transfer) => {
    const transferDate = toDate(transfer.date ?? null);
    if (!transferDate) {
      missingDateTransfers += 1;
      return false;
    }
    return transferDate >= minDate && transferDate < maxDateExclusive;
  });

  log.info(`📥 Transfers fetched from API (raw rows): ${fetchedTransferRows}`);
  log.info(`📥 Transfers after dedupe: ${dedupedTransfers.length}`);
  log.info(`📥 Transfers in window ${minYear}-${currentYear}: ${scopedTransfers.length}`);
  log.info(`🟡 Transfers skipped (missing date): ${missingDateTransfers}`);

  const teamRows = await db.team.findMany({ select: { id: true, sportmonksId: true } });
  const playerRows = await db.player.findMany({ select: { id: true, sportmonksId: true } });
  const teamIdBySportmonksId = new Map(teamRows.map((team) => [team.sportmonksId, team.id]));
  const playerIdBySportmonksId = new Map(playerRows.map((player) => [player.sportmonksId, player.id]));

  let skippedTransfers = 0;
  let createdTeamsFromTransfer = 0;
  let createdPlayersFromTransfer = 0;
  const sampleSkippedTransferIds: number[] = [];

  const playersToCreate = new Map<number, PlayerDto | null | undefined>();
  const teamsToCreate = new Map<number, TeamDto | null | undefined>();

  for (let i = 0; i < scopedTransfers.length; i++) {
    const transfer = scopedTransfers[i];
    const playerSportmonksId = transfer.player?.id ?? transfer.player_id ?? null;
    if (playerSportmonksId != null && !playerIdBySportmonksId.has(playerSportmonksId)) {
      if (!playersToCreate.has(playerSportmonksId)) {
        playersToCreate.set(playerSportmonksId, transfer.player ?? null);
      }
    }

    const fromTeamSportmonksId = transfer.fromTeam?.id ?? transfer.from_team_id ?? null;
    if (fromTeamSportmonksId != null && !teamIdBySportmonksId.has(fromTeamSportmonksId)) {
      if (!teamsToCreate.has(fromTeamSportmonksId)) {
        teamsToCreate.set(fromTeamSportmonksId, transfer.fromTeam ?? null);
      }
    }

    const toTeamSportmonksId = transfer.toTeam?.id ?? transfer.to_team_id ?? null;
    if (toTeamSportmonksId != null && !teamIdBySportmonksId.has(toTeamSportmonksId)) {
      if (!teamsToCreate.has(toTeamSportmonksId)) {
        teamsToCreate.set(toTeamSportmonksId, transfer.toTeam ?? null);
      }
    }
  }

  const playerCreateRows = Array.from(playersToCreate.entries()).map(([sportmonksId, player]) => ({
    sportmonksId,
    name: player?.name?.trim() || `Player ${sportmonksId}`,
    displayName: player?.display_name?.trim() || null,
    imagePath: player?.image_path?.trim() || null,
    positionId: player?.position_id ?? null,
  }));
  const teamCreateRows = Array.from(teamsToCreate.entries())
    .map(([sportmonksId, team]) => ({
      sportmonksId,
      name: team?.name?.trim() || null,
      shortCode: team?.short_code?.trim() || null,
      imagePath: team?.image_path?.trim() || null,
    }))
    .filter((row): row is { sportmonksId: number; name: string; shortCode: string | null; imagePath: string | null } => row.name != null);

  for (let i = 0; i < playerCreateRows.length; i += CREATE_BATCH_SIZE) {
    const chunk = playerCreateRows.slice(i, i + CREATE_BATCH_SIZE);
    await db.player.createMany({ data: chunk, skipDuplicates: true });
  }
  for (let i = 0; i < teamCreateRows.length; i += CREATE_BATCH_SIZE) {
    const chunk = teamCreateRows.slice(i, i + CREATE_BATCH_SIZE);
    await db.team.createMany({ data: chunk, skipDuplicates: true });
  }

  createdPlayersFromTransfer = playerCreateRows.length;
  createdTeamsFromTransfer = teamCreateRows.length;

  if (playersToCreate.size > 0) {
    const refreshedPlayers = await db.player.findMany({
      where: { sportmonksId: { in: Array.from(playersToCreate.keys()) } },
      select: { id: true, sportmonksId: true },
    });
    for (let i = 0; i < refreshedPlayers.length; i++) {
      const row = refreshedPlayers[i];
      playerIdBySportmonksId.set(row.sportmonksId, row.id);
    }
  }

  if (teamsToCreate.size > 0) {
    const refreshedTeams = await db.team.findMany({
      where: { sportmonksId: { in: Array.from(teamsToCreate.keys()) } },
      select: { id: true, sportmonksId: true },
    });
    for (let i = 0; i < refreshedTeams.length; i++) {
      const row = refreshedTeams[i];
      teamIdBySportmonksId.set(row.sportmonksId, row.id);
    }
  }

  const transferRows: TransferRow[] = [];
  for (let i = 0; i < scopedTransfers.length; i++) {
    const transfer = scopedTransfers[i];
    const playerSportmonksId = transfer.player?.id ?? transfer.player_id ?? null;
    const playerId = playerSportmonksId != null ? (playerIdBySportmonksId.get(playerSportmonksId) ?? null) : null;

    if (playerId == null) {
      skippedTransfers += 1;
      if (sampleSkippedTransferIds.length < 20) {
        sampleSkippedTransferIds.push(transfer.id);
      }
      continue;
    }

    const fromTeamSportmonksId = transfer.fromTeam?.id ?? transfer.from_team_id ?? null;
    const toTeamSportmonksId = transfer.toTeam?.id ?? transfer.to_team_id ?? null;

    transferRows.push({
      sportmonksId: transfer.id,
      playerId,
      fromTeamId: fromTeamSportmonksId != null ? (teamIdBySportmonksId.get(fromTeamSportmonksId) ?? null) : null,
      toTeamId: toTeamSportmonksId != null ? (teamIdBySportmonksId.get(toTeamSportmonksId) ?? null) : null,
      type: asString(transfer.transfer_type) ?? asString(transfer.type),
      date: toDate(transfer.date ?? null),
      amount: asString(transfer.amount),
    });
  }

  if (transferRows.length === 0) {
    log.warn("⚠️  Transfer sync finished with no valid rows to persist.");
    return;
  }

  const totalBefore = await db.transfer.count();
  const isInitialLoad = totalBefore === 0;
  let insertedTransfers = 0;
  for (let i = 0; i < transferRows.length; i += CREATE_BATCH_SIZE) {
    const chunk = transferRows.slice(i, i + CREATE_BATCH_SIZE);
    const result = await db.transfer.createMany({ data: chunk, skipDuplicates: true });
    insertedTransfers += result.count;

    const progress = Math.min(i + CREATE_BATCH_SIZE, transferRows.length);
    if (progress % 2500 === 0 || progress === transferRows.length) {
      log.info(`💾 Insert progress: ${progress}/${transferRows.length} transfers`);
    }
  }

  let updatedTransfers = 0;
  if (!isInitialLoad) {
    const recentThreshold = new Date(Date.now() - RECENT_UPDATE_DAYS * 24 * 60 * 60 * 1000);
    const recentRows = transferRows.filter((row) => row.date != null && row.date >= recentThreshold);
    for (let i = 0; i < recentRows.length; i += UPSERT_BATCH_SIZE) {
      const chunk = recentRows.slice(i, i + UPSERT_BATCH_SIZE);
      await Promise.all(
        chunk.map((row) =>
          db.transfer.upsert({
            where: { sportmonksId: row.sportmonksId },
            create: row,
            update: {
              playerId: row.playerId,
              fromTeamId: row.fromTeamId,
              toTeamId: row.toTeamId,
              type: row.type,
              date: row.date,
              amount: row.amount,
            },
          })
        )
      );
      updatedTransfers += chunk.length;
    }
  }

  const totalRows = await db.transfer.count();
  log.info("✅ Transfers sync summary");
  log.info(`🗓️ Window: ${minYear}-${currentYear}`);
  log.info(`🟢 Inserted: ${insertedTransfers}`);
  log.info(`🟢 Updated recent rows: ${updatedTransfers}`);
  log.info(`🟡 Skipped: ${skippedTransfers}`);
  log.info(`🟣 Players created from transfers: ${createdPlayersFromTransfer}`);
  log.info(`🟣 Teams created from transfers: ${createdTeamsFromTransfer}`);
  if (sampleSkippedTransferIds.length > 0) {
    log.warn(`⚠️  Sample skipped transfer IDs: ${sampleSkippedTransferIds.join(", ")}`);
  }
  log.info(`📦 Total rows in Transfer table: ${totalRows}`);
  log.info("=== TRANSFERS END ===");
};

export { syncTransfers };

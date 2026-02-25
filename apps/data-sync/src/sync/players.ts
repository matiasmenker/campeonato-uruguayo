import type { PrismaClient } from "db";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

interface PlayerDetailsRaw {
  id: number;
  name?: string | null;
  display_name?: string | null;
  image_path?: string | null;
  position_id?: number | null;
}

interface SquadPlayerRaw {
  player_id?: number | null;
  position_id?: number | null;
  player?: PlayerDetailsRaw | null;
}

interface TeamWithPlayersRaw {
  id: number;
  players?: SquadPlayerRaw[] | null;
}

const mapPlayer = (player: PlayerDetailsRaw, fallbackPositionId: number | null) => {
  return {
    sportmonksId: player.id,
    name: player.name?.trim() || `Player ${player.id}`,
    displayName: player.display_name?.trim() || null,
    imagePath: player.image_path?.trim() || null,
    positionId: player.position_id ?? fallbackPositionId ?? null,
  };
};

const syncPlayers = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== PLAYERS START ===");
  log.info("🚀 Syncing Players...");

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Player sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: {
      leagueId: uruguayLeague.id,
    },
    select: { sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Player sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  let savedPlayers = 0;
  let skippedPlayers = 0;
  const seenPlayerIds = new Set<number>();

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const teams = await client.getAllPages<TeamWithPlayersRaw>(`/teams/seasons/${season.sportmonksId}`, {
      perPage: 50,
      include: "players.player",
    });
    log.info(`📥 Teams fetched from API (${season.sportmonksId}): ${teams.length}`);

    for (let j = 0; j < teams.length; j++) {
      const team = teams[j];
      const squadPlayers = team.players ?? [];

      for (const squadPlayer of squadPlayers) {
        const player = squadPlayer.player;
        const playerSportmonksId = player?.id ?? squadPlayer.player_id ?? null;

        if (!playerSportmonksId) {
          skippedPlayers += 1;
          continue;
        }

        if (seenPlayerIds.has(playerSportmonksId)) {
          continue;
        }

        seenPlayerIds.add(playerSportmonksId);

        const mapped = mapPlayer(
          {
            id: playerSportmonksId,
            name: player?.name ?? null,
            display_name: player?.display_name ?? null,
            image_path: player?.image_path ?? null,
            position_id: player?.position_id ?? null,
          },
          squadPlayer.position_id ?? null
        );

        await db.player.upsert({
          where: { sportmonksId: mapped.sportmonksId },
          create: mapped,
          update: mapped,
        });
        savedPlayers += 1;
      }

      const teamProgress = j + 1;
      if (teamProgress % 25 === 0 || teamProgress === teams.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${teamProgress}/${teams.length} teams`);
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.player.count();
  log.info("✅ Players sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedPlayers}`);
  log.info(`🟡 Skipped: ${skippedPlayers}`);
  log.info(`📦 Total rows in Player table: ${totalRows}`);
  log.info("=== PLAYERS END ===");
};

export { syncPlayers };

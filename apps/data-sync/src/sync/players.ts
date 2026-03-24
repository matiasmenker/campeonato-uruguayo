import type { PlayerDto, TeamWithPlayersDto } from "sportmonks-client";
import type { SyncDependencies, SyncOptions } from "./shared.js";

const mapPlayer = (player: PlayerDto, fallbackPositionId: number | null, countryMap: Map<number, number>) => {
  const smCountryId = player.country_id ?? player.nationality_id ?? null;
  const countryId = smCountryId ? (countryMap.get(smCountryId) ?? null) : null;

  return {
    sportmonksId: player.id,
    countryId,
    name: player.name?.trim() || `Player ${player.id}`,
    commonName: player.common_name?.trim() || null,
    firstName: player.firstname?.trim() || null,
    lastName: player.lastname?.trim() || null,
    displayName: player.display_name?.trim() || null,
    imagePath: player.image_path?.trim() || null,
    positionId: player.position_id ?? fallbackPositionId ?? null,
    detailedPositionId: player.detailed_position_id ?? null,
    dateOfBirth: player.date_of_birth ? new Date(player.date_of_birth) : null,
    height: player.height ?? null,
    weight: player.weight ?? null,
    gender: player.gender?.trim() || null,
  };
};

const syncPlayers = async ({ client, db, log }: SyncDependencies, options?: SyncOptions): Promise<void> => {
  log.info("=== PLAYERS START ===");
  log.info("🚀 Syncing Players...");

  // Build country sportmonksId → internal id map for player nationality
  const countries = await db.country.findMany({ select: { id: true, sportmonksId: true } });
  const countryMap = new Map<number, number>(countries.map((c) => [c.sportmonksId, c.id]));
  log.info(`📥 Country map loaded: ${countryMap.size} entries`);

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
      ...(options?.seasonSportmonksIds ? { sportmonksId: { in: options.seasonSportmonksIds } } : {}),
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

    const teams = await client.getAllPages<TeamWithPlayersDto>(`/teams/seasons/${season.sportmonksId}`, {
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
            common_name: player?.common_name ?? null,
            firstname: player?.firstname ?? null,
            lastname: player?.lastname ?? null,
            display_name: player?.display_name ?? null,
            image_path: player?.image_path ?? null,
            position_id: player?.position_id ?? null,
            detailed_position_id: player?.detailed_position_id ?? null,
            country_id: player?.country_id ?? null,
            nationality_id: player?.nationality_id ?? null,
            date_of_birth: player?.date_of_birth ?? null,
            height: player?.height ?? null,
            weight: player?.weight ?? null,
            gender: player?.gender ?? null,
          },
          squadPlayer.position_id ?? null,
          countryMap
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

import type { PrismaClient } from "db";
import type { SquadEntryRaw, TeamRaw } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const firstDate = (...values: Array<string | null | undefined>): Date | null => {
  for (const value of values) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const syncSquadMemberships = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== SQUAD MEMBERSHIPS START ===");
  log.info("🚀 Syncing Squad Memberships...");

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Squad memberships sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: { leagueId: uruguayLeague.id },
    select: { id: true, sportmonksId: true, startingAt: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Squad memberships sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  let savedMemberships = 0;
  let skippedMemberships = 0;

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const seasonTeams = await client.getAllPages<TeamRaw>(`/teams/seasons/${season.sportmonksId}`, {
      perPage: 50,
    });
    log.info(`📥 Teams fetched from API (${season.sportmonksId}): ${seasonTeams.length}`);

    for (let j = 0; j < seasonTeams.length; j++) {
      const teamDto = seasonTeams[j];
      const teamProgress = j + 1;
      log.info(`🔎 Processing team ${teamProgress}/${seasonTeams.length} (season ${season.sportmonksId}): ${teamDto.id}`);

      const localTeam = await db.team.upsert({
        where: { sportmonksId: teamDto.id },
        create: {
          sportmonksId: teamDto.id,
          name: teamDto.name?.trim() || `Team ${teamDto.id}`,
          shortCode: teamDto.short_code?.trim() || null,
          imagePath: teamDto.image_path?.trim() || null,
        },
        update: {
          name: teamDto.name?.trim() || `Team ${teamDto.id}`,
          shortCode: teamDto.short_code?.trim() || null,
          imagePath: teamDto.image_path?.trim() || null,
        },
        select: { id: true },
      });

      const squadEntries = await client.getAllPages<SquadEntryRaw>(
        `/squads/seasons/${season.sportmonksId}/teams/${teamDto.id}`,
        {
          perPage: 50,
          include: "player",
        }
      );
      log.info(
        `📥 Squad entries fetched from API (season ${season.sportmonksId}, team ${teamDto.id}): ${squadEntries.length}`
      );

      for (const squadEntry of squadEntries) {
        const playerSportmonksId = squadEntry.player?.id ?? squadEntry.player_id ?? null;
        if (!playerSportmonksId) {
          skippedMemberships += 1;
          continue;
        }

        const localPlayer = await db.player.upsert({
          where: { sportmonksId: playerSportmonksId },
          create: {
            sportmonksId: playerSportmonksId,
            name: squadEntry.player?.name?.trim() || `Player ${playerSportmonksId}`,
            displayName: squadEntry.player?.display_name?.trim() || null,
            imagePath: squadEntry.player?.image_path?.trim() || null,
            positionId: squadEntry.player?.position_id ?? null,
          },
          update: squadEntry.player
            ? {
                name: squadEntry.player.name?.trim() || `Player ${playerSportmonksId}`,
                displayName: squadEntry.player.display_name?.trim() || null,
                imagePath: squadEntry.player.image_path?.trim() || null,
                positionId: squadEntry.player.position_id ?? null,
              }
            : {},
          select: { id: true },
        });

        const fromDate =
          firstDate(
            squadEntry.from,
            squadEntry.starting_at,
            squadEntry.start_date
          ) ?? season.startingAt;
        const toDate = firstDate(squadEntry.to, squadEntry.ending_at, squadEntry.end_date);

        const isLoan = squadEntry.is_loan ?? false;

        await db.squadMembership.upsert({
          where: {
            playerId_teamId_seasonId_from: {
              playerId: localPlayer.id,
              teamId: localTeam.id,
              seasonId: season.id,
              from: fromDate,
            },
          },
          create: {
            playerId: localPlayer.id,
            teamId: localTeam.id,
            seasonId: season.id,
            from: fromDate,
            to: toDate,
            shirtNumber: squadEntry.jersey_number ?? squadEntry.number ?? null,
            isLoan,
          },
          update: {
            to: toDate,
            shirtNumber: squadEntry.jersey_number ?? squadEntry.number ?? null,
            isLoan,
          },
        });
        savedMemberships += 1;
      }

      if (teamProgress % 10 === 0 || teamProgress === seasonTeams.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${teamProgress}/${seasonTeams.length} teams`);
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.squadMembership.count();
  log.info("✅ Squad memberships sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedMemberships}`);
  log.info(`🟡 Skipped: ${skippedMemberships}`);
  log.info(`📦 Total rows in SquadMembership table: ${totalRows}`);
  log.info("=== SQUAD MEMBERSHIPS END ===");
};

export { syncSquadMemberships };

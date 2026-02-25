import type { PrismaClient } from "db";
import type { TeamDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const mapTeam = (teamDto: TeamDto) => {
  return {
    sportmonksId: teamDto.id,
    name: teamDto.name,
    shortCode: teamDto.short_code?.trim() || null,
    imagePath: teamDto.image_path?.trim() || null,
  };
};

const syncTeams = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== TEAMS START ===");
  log.info("🚀 Syncing Teams...");

  const currentYear = new Date().getUTCFullYear();
  const minYear = currentYear - 4;

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Team sync skipped: Uruguay league not found. Run sync:leagues first.");
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
    select: { sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Team sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  let savedTeams = 0;
  let skippedTeams = 0;
  const seenTeamIds = new Set<number>();

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const seasonTeams = await client.getAllPages<TeamDto>(`/teams/seasons/${season.sportmonksId}`, {
      perPage: 50,
    });
    log.info(`📥 Teams fetched from API (${season.sportmonksId}): ${seasonTeams.length}`);

    for (let j = 0; j < seasonTeams.length; j++) {
      const teamDto = seasonTeams[j];

      if (!teamDto.name?.trim()) {
        skippedTeams += 1;
        log.warn(`⚠️  Team skipped: ${teamDto.id}`);
        continue;
      }

      if (seenTeamIds.has(teamDto.id)) {
        continue;
      }

      seenTeamIds.add(teamDto.id);
      const team = mapTeam(teamDto);

      await db.team.upsert({
        where: { sportmonksId: team.sportmonksId },
        create: team,
        update: team,
      });
      savedTeams += 1;

      const teamProgress = j + 1;
      if (teamProgress % 25 === 0 || teamProgress === seasonTeams.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${teamProgress}/${seasonTeams.length} teams`);
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.team.count();
  log.info("✅ Teams sync summary");
  log.info(`🗓️ Window: ${minYear}-${currentYear}`);
  log.info(`🟢 Saved (inserted/updated): ${savedTeams}`);
  log.info(`🟡 Skipped: ${skippedTeams}`);
  log.info(`📦 Total rows in Team table: ${totalRows}`);
  log.info("=== TEAMS END ===");
};

export { syncTeams };

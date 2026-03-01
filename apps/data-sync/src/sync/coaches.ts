import type { PrismaClient } from "db";
import type { CoachDto, TeamWithCoachesDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const resolveCoachFromEntry = (entry: CoachDto): CoachDto => {
  return entry.coach ?? entry;
};

const resolveCoachSportmonksId = (entry: CoachDto): number | null => {
  const directCoach = resolveCoachFromEntry(entry);
  return directCoach.id ?? entry.coach_id ?? entry.id ?? null;
};

const resolveCoachName = (entry: CoachDto): string | null => {
  const directCoach = resolveCoachFromEntry(entry);
  const fullName = directCoach.name?.trim() || directCoach.fullname?.trim() || null;
  if (fullName) return fullName;

  const firstName = directCoach.first_name?.trim() || "";
  const lastName = directCoach.last_name?.trim() || "";
  const joined = `${firstName} ${lastName}`.trim();
  return joined.length > 0 ? joined : null;
};

const resolveCoachImagePath = (entry: CoachDto): string | null => {
  const directCoach = resolveCoachFromEntry(entry);
  return directCoach.image_path?.trim() || null;
};

const syncCoaches = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== COACHES START ===");
  log.info("🚀 Syncing Coaches...");

  const uruguayLeague = await db.league.findFirst({
    where: { country: { code: "UY" } },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Coach sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: { leagueId: uruguayLeague.id },
    select: { sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Coach sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  const teamRows = await db.team.findMany({
    select: { id: true, sportmonksId: true },
  });
  const teamIdBySportmonksId = new Map(teamRows.map((team) => [team.sportmonksId, team.id]));

  let savedCoaches = 0;
  let skippedCoaches = 0;
  let duplicateCoaches = 0;
  const seenCoachSportmonksIds = new Set<number>();
  const sampleSkippedCoachEntries: string[] = [];

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const teams = await client.getAllPages<TeamWithCoachesDto>(`/teams/seasons/${season.sportmonksId}`, {
      perPage: 50,
      include: "coaches.coach",
    });
    log.info(`📥 Teams fetched from API (${season.sportmonksId}): ${teams.length}`);

    for (let j = 0; j < teams.length; j++) {
      const team = teams[j];
      const teamProgress = j + 1;
      const localTeamId = teamIdBySportmonksId.get(team.id) ?? null;
      const coaches = team.coaches ?? [];

      for (let k = 0; k < coaches.length; k++) {
        const coach = coaches[k];
        const coachSportmonksId = resolveCoachSportmonksId(coach);
        const coachName = resolveCoachName(coach);
        const coachImagePath = resolveCoachImagePath(coach);

        if (coachSportmonksId == null || !coachName) {
          skippedCoaches += 1;
          if (sampleSkippedCoachEntries.length < 20) {
            sampleSkippedCoachEntries.push(JSON.stringify(coach));
          }
          continue;
        }

        if (seenCoachSportmonksIds.has(coachSportmonksId)) {
          duplicateCoaches += 1;
          continue;
        }
        seenCoachSportmonksIds.add(coachSportmonksId);

        await db.coach.upsert({
          where: { sportmonksId: coachSportmonksId },
          create: {
            sportmonksId: coachSportmonksId,
            teamId: localTeamId,
            name: coachName,
            imagePath: coachImagePath,
          },
          update: {
            teamId: localTeamId,
            name: coachName,
            imagePath: coachImagePath,
          },
        });

        savedCoaches += 1;
      }

      if (teamProgress % 10 === 0 || teamProgress === teams.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${teamProgress}/${teams.length} teams`);
      }
    }

    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.coach.count();
  log.info("✅ Coaches sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedCoaches}`);
  log.info(`🟡 Skipped: ${skippedCoaches}`);
  log.info(`🟡 Duplicates ignored: ${duplicateCoaches}`);
  if (sampleSkippedCoachEntries.length > 0) {
    log.warn(`⚠️  Sample skipped coach entries: ${sampleSkippedCoachEntries.join(" | ")}`);
  }
  log.info(`📦 Total rows in Coach table: ${totalRows}`);
  log.info("=== COACHES END ===");
};

export { syncCoaches };

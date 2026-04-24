import type { CoachDto, TeamWithCoachesDto } from "sportmonks-client";
import type { SyncDependencies, SyncOptions } from "./shared.js";

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

const syncCoaches = async (
  { client, db, log }: SyncDependencies,
  options?: SyncOptions
): Promise<void> => {
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
    where: {
      leagueId: uruguayLeague.id,
      isCurrent: true,
      ...(options?.seasonSportmonksIds
        ? { sportmonksId: { in: options.seasonSportmonksIds } }
        : {}),
    },
    select: { id: true, sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Coach sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  const seasonMap = new Map(seasons.map((s) => [s.sportmonksId, s.id]));

  const teamRows = await db.team.findMany({
    select: { id: true, sportmonksId: true },
  });
  const teamMap = new Map(teamRows.map((t) => [t.sportmonksId, t.id]));

  let savedCoaches = 0;
  let savedAssignments = 0;
  let skippedCoaches = 0;
  const seenCoachSportmonksIds = new Set<number>();

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const localSeasonId = seasonMap.get(season.sportmonksId)!;
    log.info(`🔎 Processing season ${i + 1}/${seasons.length}: ${season.sportmonksId}`);

    const teams = await client.getAllPages<TeamWithCoachesDto>(
      `/teams/seasons/${season.sportmonksId}`,
      {
        perPage: 50,
        include: "coaches.coach",
      }
    );
    log.info(`📥 Teams fetched from API (${season.sportmonksId}): ${teams.length}`);

    for (let j = 0; j < teams.length; j++) {
      const team = teams[j];
      const localTeamId = teamMap.get(team.id) ?? null;
      const coaches = team.coaches ?? [];

      for (const coach of coaches) {
        const coachSportmonksId = resolveCoachSportmonksId(coach);
        const coachName = resolveCoachName(coach);
        const coachImagePath = resolveCoachImagePath(coach);

        if (coachSportmonksId == null || !coachName) {
          skippedCoaches += 1;
          continue;
        }

        if (!seenCoachSportmonksIds.has(coachSportmonksId)) {
          seenCoachSportmonksIds.add(coachSportmonksId);
          await db.coach.upsert({
            where: { sportmonksId: coachSportmonksId },
            create: {
              sportmonksId: coachSportmonksId,
              name: coachName,
              imagePath: coachImagePath,
            },
            update: {
              name: coachName,
              imagePath: coachImagePath,
            },
          });
          savedCoaches += 1;
        }

        if (localTeamId) {
          const localCoach = await db.coach.findUnique({
            where: { sportmonksId: coachSportmonksId },
            select: { id: true },
          });

          if (localCoach) {
            await db.coachAssignment.upsert({
              where: {
                coachId_teamId_seasonId: {
                  coachId: localCoach.id,
                  teamId: localTeamId,
                  seasonId: localSeasonId,
                },
              },
              create: {
                coachId: localCoach.id,
                teamId: localTeamId,
                seasonId: localSeasonId,
              },
              update: {},
            });
            savedAssignments += 1;
          }
        }
      }

      if ((j + 1) % 10 === 0 || j + 1 === teams.length) {
        log.info(`💾 Season progress (${season.sportmonksId}): ${j + 1}/${teams.length} teams`);
      }
    }

    log.info(`💾 Progress: ${i + 1}/${seasons.length} seasons`);
  }

  const totalCoaches = await db.coach.count();
  const totalAssignments = await db.coachAssignment.count();
  log.info("✅ Coaches sync summary");
  log.info(`🟢 Coaches saved: ${savedCoaches}`);
  log.info(`🟢 Assignments saved: ${savedAssignments}`);
  log.info(`🟡 Skipped: ${skippedCoaches}`);
  log.info(`📦 Total Coach rows: ${totalCoaches}`);
  log.info(`📦 Total CoachAssignment rows: ${totalAssignments}`);
  log.info("=== COACHES END ===");
};

export { syncCoaches };

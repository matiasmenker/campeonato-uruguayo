import type { PrismaClient } from "db";
import type { StandingDetailDto, StandingDto } from "sportmonks-client";
import type { Logger } from "../logger.js";
import type { SportMonksClient } from "../sportmonks.js";

export interface SyncDependencies {
  client: SportMonksClient;
  db: PrismaClient;
  log: Logger;
}

const extractArray = <T>(raw: { data: T[] } | T[] | undefined): T[] => {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : raw.data ?? [];
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === "object" && value != null) {
    const record = value as Record<string, unknown>;
    if ("value" in record) return toNumber(record.value);
    if ("total" in record) return toNumber(record.total);
  }
  return null;
};

const toInt = (value: unknown): number | null => {
  const parsed = toNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
};

const pickNumberFromDto = (dto: StandingDto, keys: string[]): number | null => {
  const row = dto as unknown as Record<string, unknown>;
  for (let i = 0; i < keys.length; i++) {
    const parsed = toInt(row[keys[i]]);
    if (parsed != null) return parsed;
  }
  return null;
};

const pickNumberFromDetails = (
  details: StandingDetailDto[] | null | undefined,
  typeIds: readonly number[]
): number | null => {
  if (!details || details.length === 0) return null;

  for (let i = 0; i < details.length; i++) {
    const detail = details[i];
    if (detail.type_id == null || !typeIds.includes(detail.type_id)) {
      continue;
    }
    const parsed = toInt(detail.value ?? detail.data ?? null);
    if (parsed != null) return parsed;
  }

  return null;
};

const resolveMetric = (
  dto: StandingDto,
  details: StandingDetailDto[] | null | undefined,
  dtoKeys: string[],
  typeIds: readonly number[]
): number | null => {
  const fromDto = pickNumberFromDto(dto, dtoKeys);
  if (fromDto != null) return fromDto;
  return pickNumberFromDetails(details, typeIds);
};

const DETAIL_TYPE_IDS = {
  played: [129] as const,
  won: [130] as const,
  draw: [131] as const,
  lost: [132] as const,
  goalsFor: [133] as const,
  goalsAgainst: [134] as const,
};

const syncStandings = async ({ client, db, log }: SyncDependencies): Promise<void> => {
  log.info("=== STANDINGS START ===");
  log.info("🚀 Syncing Standings...");

  const uruguayLeague = await db.league.findFirst({
    where: {
      country: {
        code: "UY",
      },
    },
    select: { id: true },
  });

  if (!uruguayLeague) {
    log.warn("⚠️  Standing sync skipped: Uruguay league not found. Run sync:leagues first.");
    return;
  }

  const seasons = await db.season.findMany({
    where: { leagueId: uruguayLeague.id },
    select: { id: true, sportmonksId: true },
    orderBy: { endingAt: "desc" },
  });

  if (seasons.length === 0) {
    log.warn("⚠️  Standing sync skipped: no seasons found. Run sync:seasons first.");
    return;
  }

  log.info(`📥 Seasons loaded from database: ${seasons.length}`);

  const teams = await db.team.findMany({
    select: { id: true, sportmonksId: true },
  });
  const teamIdBySportmonksId = new Map(teams.map((team) => [team.sportmonksId, team.id]));

  const stages = await db.stage.findMany({
    select: { id: true, sportmonksId: true },
  });
  const stageIdBySportmonksId = new Map(stages.map((stage) => [stage.sportmonksId, stage.id]));

  let savedRows = 0;
  let skippedRows = 0;
  let duplicateRowsMerged = 0;
  let rowsWithoutTeam = 0;
  let rowsWithoutMetrics = 0;
  const sampleMissingTeamParticipantIds: number[] = [];
  const sampleMissingMetricStandingIds: number[] = [];

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonProgress = i + 1;
    log.info(`🔎 Processing season ${seasonProgress}/${seasons.length}: ${season.sportmonksId}`);

    const standingsResponse = await client.get<StandingDto[] | { data: StandingDto[] }>(
      `/standings/seasons/${season.sportmonksId}`,
      { include: "participant;details" }
    );
    const standings = extractArray(standingsResponse as StandingDto[] | { data: StandingDto[] });
    log.info(`📥 Standings fetched from API (${season.sportmonksId}): ${standings.length}`);

    const standingByKey = new Map<
      string,
      {
        seasonId: number;
        stageId: number | null;
        teamId: number;
        position: number;
        points: number;
        played: number;
        won: number;
        draw: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
      }
    >();

    for (let j = 0; j < standings.length; j++) {
      const standingDto = standings[j];
      const details = standingDto.details ?? [];

      const participantSportmonksId =
        standingDto.participant_id ?? standingDto.participant?.id ?? null;
      if (participantSportmonksId == null) {
        skippedRows += 1;
        rowsWithoutTeam += 1;
        continue;
      }

      const teamId = teamIdBySportmonksId.get(participantSportmonksId) ?? null;
      if (teamId == null) {
        skippedRows += 1;
        rowsWithoutTeam += 1;
        if (sampleMissingTeamParticipantIds.length < 20) {
          sampleMissingTeamParticipantIds.push(participantSportmonksId);
        }
        continue;
      }

      const stageId =
        standingDto.stage_id != null
          ? stageIdBySportmonksId.get(standingDto.stage_id) ?? null
          : null;

      const position = resolveMetric(standingDto, details, ["position"], []);
      const points = resolveMetric(standingDto, details, ["points"], []);
      const played = resolveMetric(standingDto, details, ["played", "games_played"], DETAIL_TYPE_IDS.played);
      const won = resolveMetric(standingDto, details, ["won", "wins"], DETAIL_TYPE_IDS.won);
      const draw = resolveMetric(standingDto, details, ["draw", "drawn"], DETAIL_TYPE_IDS.draw);
      const lost = resolveMetric(standingDto, details, ["lost", "losses"], DETAIL_TYPE_IDS.lost);
      const goalsFor = resolveMetric(
        standingDto,
        details,
        ["goals_for", "goals_scored"],
        DETAIL_TYPE_IDS.goalsFor
      );
      const goalsAgainst = resolveMetric(
        standingDto,
        details,
        ["goals_against", "goals_conceded"],
        DETAIL_TYPE_IDS.goalsAgainst
      );

      const hasMissingMetric =
        position == null ||
        points == null ||
        played == null ||
        won == null ||
        draw == null ||
        lost == null ||
        goalsFor == null ||
        goalsAgainst == null;
      if (hasMissingMetric) {
        skippedRows += 1;
        rowsWithoutMetrics += 1;
        if (sampleMissingMetricStandingIds.length < 20) {
          sampleMissingMetricStandingIds.push(standingDto.id);
        }
        continue;
      }

      const key = `${season.id}:${stageId ?? "null"}:${teamId}`;
      if (standingByKey.has(key)) {
        duplicateRowsMerged += 1;
      }

      standingByKey.set(key, {
        seasonId: season.id,
        stageId,
        teamId,
        position,
        points,
        played,
        won,
        draw,
        lost,
        goalsFor,
        goalsAgainst,
      });
    }

    const standingRows = Array.from(standingByKey.values());

    await db.$transaction(async (tx) => {
      await tx.standing.deleteMany({ where: { seasonId: season.id } });
      if (standingRows.length > 0) {
        await tx.standing.createMany({ data: standingRows });
      }
    });

    savedRows += standingRows.length;
    log.info(`💾 Progress: ${seasonProgress}/${seasons.length} seasons`);
  }

  const totalRows = await db.standing.count();
  log.info("✅ Standings sync summary");
  log.info(`🟢 Saved (inserted/updated): ${savedRows}`);
  log.info(`🟡 Skipped: ${skippedRows}`);
  log.info(`🟡 Duplicate rows merged: ${duplicateRowsMerged}`);
  log.info(`🟡 Rows skipped (team not found): ${rowsWithoutTeam}`);
  if (sampleMissingTeamParticipantIds.length > 0) {
    log.warn(`⚠️  Sample missing team participant IDs: ${sampleMissingTeamParticipantIds.join(", ")}`);
  }
  log.info(`🟡 Rows skipped (missing metrics): ${rowsWithoutMetrics}`);
  if (sampleMissingMetricStandingIds.length > 0) {
    log.warn(`⚠️  Sample standing IDs with missing metrics: ${sampleMissingMetricStandingIds.join(", ")}`);
  }
  log.info(`📦 Total rows in Standing table: ${totalRows}`);
  log.info("=== STANDINGS END ===");
};

export { syncStandings };

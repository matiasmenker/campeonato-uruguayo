import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../../.env") });

import { PrismaClient } from 'db';
const db = new PrismaClient();

async function main() {
  console.log("Backfilling Lineup.teamId from SquadMembership...");

  // Step 1: Players with squad membership in exactly one of home/away team
  const step1 = await db.$executeRaw`
    UPDATE "Lineup" l
    SET "teamId" = (
      SELECT sm."teamId"
      FROM "SquadMembership" sm
      JOIN "Fixture" f ON f."id" = l."fixtureId"
      WHERE sm."playerId" = l."playerId"
        AND sm."seasonId" = f."seasonId"
        AND (sm."teamId" = f."homeTeamId" OR sm."teamId" = f."awayTeamId")
      GROUP BY sm."teamId"
      LIMIT 1
    )
    WHERE l."teamId" IS NULL
    AND (
      SELECT COUNT(DISTINCT sm2."teamId")
      FROM "SquadMembership" sm2
      JOIN "Fixture" f2 ON f2."id" = l."fixtureId"
      WHERE sm2."playerId" = l."playerId"
        AND sm2."seasonId" = f2."seasonId"
        AND (sm2."teamId" = f2."homeTeamId" OR sm2."teamId" = f2."awayTeamId")
    ) = 1
  `;
  console.log(`Step 1 (single team match): ${step1} lineups updated`);

  // Step 2: Multi-team players → match by jersey number
  const step2 = await db.$executeRaw`
    UPDATE "Lineup" l
    SET "teamId" = (
      SELECT sm."teamId"
      FROM "SquadMembership" sm
      JOIN "Fixture" f ON f."id" = l."fixtureId"
      WHERE sm."playerId" = l."playerId"
        AND sm."seasonId" = f."seasonId"
        AND (sm."teamId" = f."homeTeamId" OR sm."teamId" = f."awayTeamId")
        AND sm."shirtNumber" = l."jerseyNumber"
      LIMIT 1
    )
    WHERE l."teamId" IS NULL
      AND l."jerseyNumber" IS NOT NULL
      AND (
        SELECT sm."teamId"
        FROM "SquadMembership" sm
        JOIN "Fixture" f ON f."id" = l."fixtureId"
        WHERE sm."playerId" = l."playerId"
          AND sm."seasonId" = f."seasonId"
          AND (sm."teamId" = f."homeTeamId" OR sm."teamId" = f."awayTeamId")
          AND sm."shirtNumber" = l."jerseyNumber"
        LIMIT 1
      ) IS NOT NULL
  `;
  console.log(`Step 2 (jersey tiebreaker): ${step2} lineups updated`);

  // Step 3: Multi-team, no jersey match → pick any (first alphabetically by teamId)
  const step3 = await db.$executeRaw`
    UPDATE "Lineup" l
    SET "teamId" = (
      SELECT sm."teamId"
      FROM "SquadMembership" sm
      JOIN "Fixture" f ON f."id" = l."fixtureId"
      WHERE sm."playerId" = l."playerId"
        AND sm."seasonId" = f."seasonId"
        AND (sm."teamId" = f."homeTeamId" OR sm."teamId" = f."awayTeamId")
      ORDER BY sm."teamId"
      LIMIT 1
    )
    WHERE l."teamId" IS NULL
  `;
  console.log(`Step 3 (any membership fallback): ${step3} lineups updated`);

  const remaining = await db.lineup.count({ where: { teamId: null } });
  console.log(`Remaining without teamId: ${remaining}`);

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

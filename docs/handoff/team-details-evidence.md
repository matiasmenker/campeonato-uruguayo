# team-details-evidence

All numbers come from direct queries against the production database (Neon/PostgreSQL) on 2026-04-24, executed with Prisma Client. Scope: 4 integrated seasons (2023, 2024, 2025, 2026) and 22 teams that have appeared at least once in any of those seasons.

A **team-season pair** is defined as any `(teamId, seasonId)` combination that appears in either the `Standing` table or the `SquadMembership` table. This gives 64 team-season pairs across the four seasons.

## 1. TEAM-SEASON COACH COVERAGE

| Metric | Count |
|---|---:|
| Total team-season combinations | 64 |
| With coach assignment | 16 |
| Without coach assignment | 48 |

Coach coverage is **100% for the current season (2026)** and **0% for the three historical seasons (2023–2025)**. This is a deliberate design constraint: the SportMonks `/v3/football/coaches` endpoint returns the same current coaches regardless of the season filter, so the sync was restricted to `isCurrent: true` to avoid storing misleading historical data. The 48 "without coach" pairs all belong to past seasons.

## 2. TEAM-SEASON SQUAD COVERAGE

| Metric | Count |
|---|---:|
| Total team-season combinations | 64 |
| With at least 11 players | 64 |
| With fewer than 11 players | 0 |

Every team-season pair in the database has a squad of 11 or more unique players. No team-season row degrades to a half-empty squad on the Team Details page.

## 3. SHIRT NUMBER COVERAGE

| Metric | Count |
|---|---:|
| Total squad player entries (SquadMembership rows) | 2,985 |
| With shirt number | 2,672 |
| Without shirt number | 313 |

Shirt number coverage is **89.5%** across all seasons. The remaining 10.5% are memberships where SportMonks did not return a `jersey_number` field (typically older seasons or mid-season incorporations).

## 4. PLAYER IMAGE COVERAGE

Per squad entry (each `SquadMembership` row resolves to its player's image):

| Metric | Count |
|---|---:|
| Total squad player entries | 2,985 |
| With image | 2,947 |
| Without image | 38 |

Per unique player in squads (1,347 distinct players):

| Metric | Count |
|---|---:|
| Players with image | 1,309 |
| Players without image | 38 |

Image coverage per entry is **98.7%**. The 38 players without image are the lineup-fallback stubs (players created during fixture sync when a name in a lineup did not match any existing SportMonks player).

## 5. SHORT INTERPRETATION

- **Squad rendering is highly reliable:** every team-season has ≥11 players, 98.7% of squad entries have a player image, and 89.5% have a shirt number — the Team Details squad grid renders with near-complete visual fidelity.
- **Coach display is current-season-only by design:** 75% of team-season pairs have no coach because SportMonks does not expose historical coach data for this league, and the product chose to show `—` rather than fabricate history.
- **Main limitation:** the Team Details page cannot defensibly answer "who coached this team in 2024?" — it can only answer it for the current season. This is a provider-side gap, not an implementation gap.

---

### Query logic used

Queried via Prisma Client against the live Neon database (`scripts/team-details-evidence.mjs`):

- **Team-season pairs:** union of `Set<"teamId-seasonId">` built from `prisma.standing.findMany({ select: { teamId, seasonId } })` and `prisma.squadMembership.findMany({ select: { teamId, seasonId } })`.
- **Coach coverage:** intersect the pair set with `Set<"teamId-seasonId">` from `prisma.coachAssignment.findMany({ select: { teamId, seasonId } })`.
- **Squad size:** group `SquadMembership` rows by `(teamId, seasonId)` into `Map<pair, Set<playerId>>` and count unique players per pair.
- **Shirt numbers:** count `SquadMembership` rows where `shirtNumber != null`.
- **Player images:** join `SquadMembership.playerId` to `Player.imagePath` and count rows where `imagePath` is non-empty.

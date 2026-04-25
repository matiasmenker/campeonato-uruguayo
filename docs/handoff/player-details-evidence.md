# player-details-evidence

All numbers in this document come from direct queries against the production database (Neon/PostgreSQL) on 2026-04-24, executed with Prisma Client.

## 1. PLAYER PROFILE COVERAGE

| Metric | Count |
|---|---:|
| Total players | 1,437 |
| With image | 1,399 |
| Without image | 38 |
| With nationality (country) | 548 |
| Without nationality | 889 |
| With date of birth | 548 |
| Without date of birth | 889 |
| With position | 1,390 |
| Without position | 47 |

**Observation:** Image coverage (97.4%) and position coverage (96.7%) are high. Nationality and date of birth coverage is markedly lower (38.1%) because these fields are not populated by the fallback player-creation path used when a player appears in a lineup but has no SportMonks record. Country and date of birth are populated together because both come from the same SportMonks player record.

## 2. PLAYER-SEASON COVERAGE

Based on `SquadMembership` (one row per player-team-season binding):

| Metric | Count |
|---|---:|
| Total squad memberships (rows) | 2,985 |
| Unique player-season pairs | 2,621 |
| Pairs with at least one rating record (typeId 118) | 2,063 |
| Pairs with at least one minutes record (typeId 119) | 2,123 |
| **Membership pairs WITH rating data** | **2,059** |
| **Membership pairs WITHOUT rating data** | **562** |

Breakdown by season:

| Season | Memberships | With rating | Coverage |
|---|---:|---:|---:|
| 2026 | 527 | 419 | 79.5% |
| 2025 | 654 | 551 | 84.3% |
| 2024 | 718 | 547 | 76.2% |
| 2023 | 722 | 546 | 75.6% |

**Observation:** Rating coverage is consistently around 75–84% across all four seasons, indicating that SofaScore scraping has been successfully run as a backfill for past seasons, not only for the current season as originally assumed. The 16–25% of memberships without rating data correspond to players who were registered in a squad but did not play matches for which SofaScore stats were successfully scraped.

## 3. SELECTED CORE FIELDS COMPLETENESS

Core fields used (as displayed in the player details hero): `imagePath`, `countryId`, `dateOfBirth`, `positionId`.

| Metric | Count | % of total |
|---|---:|---:|
| Players with ALL core fields | 548 | 38.1% |
| Players missing one or more | 889 | 61.9% |

**Observation:** Only 38% of players have a fully complete hero card. The dominant missing fields are country and date of birth, which are populated together and together reflect whether a full SportMonks player record was ever retrieved. The remaining 62% typically have an image and position but lack nationality/DOB.

## 4. ONE COMPLETE EXAMPLE

**Player ID 16 — Martín Boselli** (Juventud, 2026 season)

All hero fields are populated: image, position, country, date of birth, height, weight. Squad membership is active for the current season at Juventud. Rating and stat data are available for the 2026 stage groups, so the stat cards, recent form, and career table all render with real values.

## 5. ONE INCOMPLETE EXAMPLE

**Player ID 3603 — Nicolas Bertocchi** (Cerro Largo, 2024 season)

This player has `sportmonksId: null`, no image, no date of birth, and no position. This is a player created by the lineup-fallback path during fixture sync: the sync detected a player name in a lineup that did not match any existing SportMonks player, and created a minimal record to preserve the fixture's integrity.

On the player details page, this results in a placeholder avatar, dashes in all biographical fields, and no position badge. Any stats recorded against this player ID are displayed, but the identity portion of the hero is effectively empty.

## 6. SHORT INTERPRETATION

- The Player Details screen is **highly reliable for identity basics** (image and position: 97%+ coverage) but **only moderately reliable for full biographical cards** (all four core fields: 38%).
- Per-season statistical data is available for roughly **75–84% of player-season combinations** across all four synced seasons, which is better than originally assumed — the SofaScore backfill extends to historical seasons.
- **The main limitation is identity completeness**, not statistical coverage: a non-trivial share of players exist in the database as minimal lineup-created stubs without nationality, DOB, or a SportMonks ID, which makes cross-season tracking and full profile rendering unreliable for that subset.

---

### Query logic used

Queried via Prisma Client against the live Neon database. Key logic:
- Profile coverage: `prisma.player.count()` with `where` filters on each nullable field.
- Season pairs: `prisma.squadMembership.findMany({ select: { playerId, seasonId } })` reduced to a `Set<"playerId-seasonId">`.
- Rating/minutes availability: `prisma.fixturePlayerStatistic.findMany({ where: { typeId: 118 | 119 }, select: { playerId, fixture: { select: { seasonId } } } })`, reduced to the same key format, then intersected with membership pairs.

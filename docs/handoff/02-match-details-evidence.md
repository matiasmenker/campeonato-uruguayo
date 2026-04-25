# 02-match-details-evidence

## 1. FIXTURE DETAIL COVERAGE

Scope: all fixtures in the database across all seasons (2023, 2024, 2025, 2026).

| Metric | Count |
|---|---|
| Total fixtures | 1,017 |
| With final score (completed) | 993 |
| Without final score (upcoming) | 24 |

All 993 completed fixtures have lineup, event, and player statistic records. The 24 fixtures without a score are upcoming 2026 season fixtures and naturally have none of these detail records.

**Implication:** For any finished fixture, the Match Details screen will always have data to render. The "no data" case only occurs for upcoming fixtures.

---

## 2. PLAYER STAT COVERAGE

Total player-statistic rows across all fixtures: **596,097**

Breakdown of the most populated stat types (by row count):

| Stat type ID | Description | Row count |
|---|---|---|
| 119 | Minutes played | 30,994 |
| 118 | Player rating | 29,404 |
| 106 | (other — not displayed on screen) | 28,160 |
| 80 | (other) | 30,259 |

At approximately 993 fixtures with stats, averages are roughly:
- **~31 minutes-played entries per fixture** (covers both starting XI and bench players who came on)
- **~30 rating entries per fixture**

Specific counts for goals (typeId 52) and assists (typeId 79) as player-stat entries were not separately queried; these types were not in the top-10 by row count, suggesting they are sparsely populated as explicit stat records. Goals and assists shown on the Match Details screen are sourced primarily from `Event` records (event typeId 14/15/16 for goals, `relatedPlayer` for assists), not from `FixturePlayerStatistic`.

Cards are similarly sourced from events (typeIds 19, 20, 21), not from stat rows.

---

## 3. LINEUP / EVENT COVERAGE

| Metric | Count |
|---|---|
| Fixtures with at least one lineup record | 993 |
| Fixtures without any lineup record | 0 (among finished fixtures) |
| Fixtures with at least one event record | 993 |
| Fixtures without any event record | 0 (among finished fixtures) |

All 993 completed fixtures have both lineup and event data. The 24 upcoming fixtures have neither.

**Note:** "Has lineup records" does not guarantee that all lineup players have `formationField` data. Older fixtures (2023–2024 era) may have `formationField = null` for some or all players, causing the page to fall back to the legacy `formationPosition` rendering path. This was not separately counted.

---

## 4. ONE COMPLETE EXAMPLE

**Fixture ID 1017 — Nacional 4–1 Plaza Colonia**
- Season: 2023
- Stage: Intermediate Round
- Round: 4

This fixture has a final score, lineup records, event records, and player statistics. On the Match Details screen it would render with:
- A score of 4–1 in the hero
- A "Finished" status badge
- Stage label: "Intermediate Round 2023 · Round 4"
- Pitch visualisation with player tokens
- Timeline showing (at minimum) the four Nacional goals and one Plaza Colonia goal
- Player rating badges on each token

This is the most recently inserted finished fixture in the database and represents the typical completed-fixture experience.

---

## 5. ONE INCOMPLETE EXAMPLE

**Any 2026 season fixture (24 fixtures without a score)**

For these fixtures, the Match Details screen renders only the hero section:
- Kickoff time is shown instead of a score
- Status badge shows "Upcoming"
- No pitch section (no lineup data)
- No bench section
- No timeline section (no events)

The sections are omitted silently — the user sees no explanation of why they are absent.

A second, more nuanced incomplete case: older fixtures where lineup players have `formationField = null`. The page falls back to the legacy layout using `formationPosition` integer grouping. The formation is less spatially accurate but the section still renders.

---

## 6. SHORT INTERPRETATION

Coverage of finished fixtures is near-complete: 993 of 1,017 fixtures have final scores, and every one of them has lineup, event, and player stat records. The Match Details screen can be expected to render its full content for any fixture where a result exists.

The main limitation is not coverage breadth but data quality: player ratings (typeId 118) are supplied by SportMonks without a disclosed methodology for the Uruguayan league, and event attribution (goal scorers, assisters) cannot be independently validated. The screen accurately displays what the provider recorded — it cannot detect or correct provider errors.

---

*Data queried via Prisma raw SQL against the production Neon PostgreSQL database, April 2026.*

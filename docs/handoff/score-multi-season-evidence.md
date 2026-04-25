# score-multi-season-evidence

All numbers in this document come from direct queries against the production database (Neon/PostgreSQL) on 2026-04-24, executed with Prisma Client.

**Scope:** This evidence pack covers two implemented features of the project:
1. The **player performance score** (season/stage-aware average of SofaScore's per-match rating, stat type ID 118), displayed on the player details page, recent form, career comparison table, and top-rated leaderboards.
2. The **multi-season comparison table** on the player details page, which shows one row per season with score, matches, goals, assists, minutes, cards and saves.

Both are fully implemented. The numbers below describe how many player-season pairs have displayable score values and how many players have more than one comparable season.

## 1. SCORE ELIGIBILITY / AVAILABILITY

Based on unique player-season pairs from the `SquadMembership` table, cross-referenced with `FixturePlayerStatistic` records of type 118 (score signal):

| Metric | Count |
|---|---:|
| Total player-season combinations (unique pairs) | 2,621 |
| With at least one rating record (score displayable) | 2,059 |
| Without any rating record (score shown as `—`) | 562 |

Per-season breakdown:

| Season | Player-season pairs | With score data | Coverage |
|---|---:|---:|---:|
| 2026 | 527 | 419 | 79.5% |
| 2025 | 654 | 551 | 84.3% |
| 2024 | 718 | 547 | 76.2% |
| 2023 | 722 | 546 | 75.6% |

**Interpretation:**
Score availability is broad and stable across all four integrated seasons (75–84% of pairs). The 16–25% without score data are handled by the product through the `—` presentation rule — the UI refuses to compute or display a score when no underlying rating record exists, deliberately distinguishing absence from poor performance.

**Implementation note on score composition**
The displayed score is computed as `mean(ratings where typeId === 118)` per player-season-stage group, rounded to two decimals. This uses SofaScore's per-match provider rating as the base signal. The project-level contribution is the scoping (by season and stage), aggregation, tier-based colour classification, and strict handling of missing data. A custom composite score was considered during design but rejected on coverage grounds (see [`05-player-performance-score.md`](05-player-performance-score.md) §9).

## 2. MULTI-SEASON COMPARABILITY

The multi-season comparison table renders one row per season in a player's membership history. A row is analytically comparable when rating data exists for that season.

| Metric | Count |
|---|---:|
| Total players with at least one squad membership | 1,347 |
| Players with 1 season only | 566 |
| Players with 2 or more seasons | 781 |
| Players with 2+ seasons AND score data in 2+ of those seasons | 589 |
| Players with 2+ seasons but score data in only 1 (or 0) of those seasons | 192 |

**Interpretation:**
- 58% of all database players appear in at least two seasons.
- Of those 781 multi-season players, 75.4% (589) have populated score values in more than one season, so the comparison table displays meaningful side-by-side numbers.
- The remaining 24.6% (192) show a mixed table — one season with a score, one with `—`. The table still renders, but quantitative comparison is not possible for those rows.

**Notes on comparability strength**

Even when score data exists in both seasons, the comparison is visual rather than strictly statistical:
- No sample-size normalisation is applied. A 5-match season and a 28-match season appear identically in the table.
- Stage composition differs across years, which affects fixture counts per row.
- The score is a raw provider-rating average; no minute-weighting or positional adjustment is applied.

These simplifications are deliberate design decisions grounded in the available data (see the design rationale in [`05-player-performance-score.md`](05-player-performance-score.md)).

## 3. ONE COMPARABLE EXAMPLE

**Pablo Lago (player ID 2)**

- Squad memberships in seasons 1 (2026) and 2 (2025).
- Score data available in both seasons.
- The multi-season comparison table shows populated rows for both years, with distinct scores in each row.
- Season switching on his player details page re-fetches and re-aggregates correctly, producing different values for each selected season.

This is a player where the multi-season comparison feature works end-to-end as intended: two rows with real values the user can directly compare.

## 4. ONE NON-COMPARABLE OR PARTIAL EXAMPLE

**Iván Rodríguez (player ID 31)**

- Squad memberships in seasons 1 (2026) and 2 (2025).
- Score data available only in season 2 (2025).
- The comparison table renders the 2025 row with a populated score and the 2026 row with `—` in the score column (other columns such as "Matches" render `—` as well if no statistics of any kind were recorded).
- The top-rated leaderboard for 2026 does not include him; for 2025 it may.

This case represents 192 players in the database (14.2% of all players, 24.6% of multi-season players). The feature still renders correctly for these players — the design deliberately shows `—` rather than imputing or hiding the row — but the comparison is one-sided.

## 5. SHORT INTERPRETATION

- **Score availability is reasonably broad** (78.6% of all player-season pairs) and consistent across the four integrated seasons. The feature renders meaningfully for the majority of player-season views.
- **Multi-season comparison works fully** for 589 out of 1,347 players (43.7%) — enough to demonstrate the feature as a design pattern but insufficient to make it universally applicable.
- **The main limitation is not availability but sample-size and composition asymmetry**: even when scores are shown for multiple seasons, they are not size-normalised or stage-adjusted. The product treats the comparison table as a descriptive surface, not a statistical one, and this is aligned with the project's overall design principle of showing only what the data can defensibly support.

---

### Query logic used

Queried via Prisma Client against the live Neon database.

- **Score availability per pair:** build `Set<"playerId-seasonId">` from all `SquadMembership` rows, then check intersection with `Set<"playerId-seasonId">` built from `FixturePlayerStatistic.findMany({ where: { typeId: 118 }, select: { playerId, fixture: { select: { seasonId } } } })`.
- **Multi-season comparability:** group memberships by player (`Record<playerId, Set<seasonId>>`), count players with `size >= 2`; same grouping over rating records; compute the intersection size per player.
- **Example selection:** `Object.entries(byPlayer).find(([pid, seasons]) => seasons.size >= 2 && ratingByPlayer[pid]?.size >= 2)` for comparable; symmetric for the single-season-rated case.

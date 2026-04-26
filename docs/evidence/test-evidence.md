# Test Evidence

## Test strategy

The automated tests focus on the highest-risk and most assessment-relevant
parts of the artefact rather than chasing line coverage. They concentrate on:

- player performance score aggregation (mean, rounding, determinism, null
  handling),
- rating tier / classification thresholds,
- missing-data defensive behaviour (dash placeholders, never silent zeros),
- season-aware filtering and data-fetch logic (URL building, knockout-stage
  exclusion, coach `isCurrent` rules),
- API smoke and integration behaviour against the real Express app and a real
  database where implemented.

These tests **complement, not replace**, the manual evaluation: the functional
walkthrough of every objective, the screenshot evidence in the appendices, the
database coverage checks produced by the data-sync reports, and the
data-quality / missing-field analysis in Appendix C.

## Mapping to project objectives

| Project objective | What was tested | Evidence / test file |
|-------------------|-----------------|----------------------|
| Player details page | Season-aware fetch URL, player image resolution, missing fields render as a dash and never as `0`, real recorded zeros render as `"0"`, age/height/weight formatters | [tests/unit/players-fetch.test.ts](../../apps/web/tests/unit/players-fetch.test.ts), [tests/unit/player-image.test.ts](../../apps/web/tests/unit/player-image.test.ts), [tests/unit/display.test.ts](../../apps/web/tests/unit/display.test.ts), [tests/component/player-stat-card.test.tsx](../../apps/web/tests/component/player-stat-card.test.tsx) |
| Match details page | Match status mapping, formation parsing with missing data, fixture / events / lineup endpoints called with the right ids, empty events and lineups handled safely | [tests/unit/match-status.test.ts](../../apps/web/tests/unit/match-status.test.ts), [tests/unit/formation.test.ts](../../apps/web/tests/unit/formation.test.ts), [tests/unit/matches-fetch.test.ts](../../apps/web/tests/unit/matches-fetch.test.ts) |
| Team details page | Squad endpoint scoped by season + stage, coach `isCurrent` true only in the active season, historical assignments never marked as current, mismatched team ids never bleed in | [tests/unit/teams-fetch.test.ts](../../apps/web/tests/unit/teams-fetch.test.ts) |
| League standings page | `filterMainStages` excludes knockout stages from league tables, standings URL built with `seasonId` + `stageId`, empty payloads return `[]` (no fabricated rows), API mappers preserve stage type | [tests/unit/seasons-filter.test.ts](../../apps/web/tests/unit/seasons-filter.test.ts), [tests/unit/standings-fetch.test.ts](../../apps/web/tests/unit/standings-fetch.test.ts), [apps/api/tests/unit/mappers.test.ts](../../apps/api/tests/unit/mappers.test.ts) |
| Player performance score | Score is the arithmetic mean of provider ratings, deterministic, rounded to 2 decimals, returns `null` (not `0`) when no rating data exists, non-numeric values filtered out, tier classification thresholds | [tests/unit/player-aggregates.test.ts](../../apps/web/tests/unit/player-aggregates.test.ts), [tests/unit/rating.test.ts](../../apps/web/tests/unit/rating.test.ts), [tests/unit/display.test.ts](../../apps/web/tests/unit/display.test.ts), [tests/component/player-stat-card.test.tsx](../../apps/web/tests/component/player-stat-card.test.tsx) |
| Multi-season comparison | Aggregates expose only descriptive keys (no `predictedRating`, `xG`, `score`, etc.), rows with no aggregates render every numeric cell as a dash, `appearances === 0` produces dashes (never zeros), real participation renders populated values, dashed and populated rows render side by side | [tests/unit/aggregates-shape.test.ts](../../apps/web/tests/unit/aggregates-shape.test.ts), [tests/unit/display.test.ts](../../apps/web/tests/unit/display.test.ts), [tests/component/career-row.test.tsx](../../apps/web/tests/component/career-row.test.tsx) |
| Public REST API | Auth middleware rejects missing / wrong keys, response mappers are pure, real Express app + real database covered end to end (skips when `DATABASE_URL` is absent) | [apps/api/tests/unit/security.test.ts](../../apps/api/tests/unit/security.test.ts), [apps/api/tests/unit/mappers.test.ts](../../apps/api/tests/unit/mappers.test.ts), [apps/api/tests/integration/api.test.ts](../../apps/api/tests/integration/api.test.ts) |

## Test files added

Web (Vitest, jsdom, React Testing Library):

- `apps/web/tests/unit/display.test.ts`
- `apps/web/tests/unit/players-fetch.test.ts`
- `apps/web/tests/unit/teams-fetch.test.ts`
- `apps/web/tests/unit/standings-fetch.test.ts`
- `apps/web/tests/unit/matches-fetch.test.ts`
- `apps/web/tests/unit/aggregates-shape.test.ts`
- `apps/web/tests/component/player-stat-card.test.tsx`
- `apps/web/tests/component/career-row.test.tsx`

Pre-existing web tests still passing:

- `apps/web/tests/unit/player-aggregates.test.ts`
- `apps/web/tests/unit/player-image.test.ts`
- `apps/web/tests/unit/seasons-filter.test.ts`
- `apps/web/tests/unit/rating.test.ts`
- `apps/web/tests/unit/match-status.test.ts`
- `apps/web/tests/unit/formation.test.ts`

API (Vitest + supertest):

- `apps/api/tests/unit/security.test.ts`
- `apps/api/tests/unit/mappers.test.ts`
- `apps/api/tests/integration/api.test.ts`

Data sync (Vitest):

- `apps/data-sync/tests/parse-sportmonks-date.test.ts`

## How to run

From the repository root:

```bash
pnpm -r --parallel --filter web --filter api --filter data-sync test
```

The full run log is captured in [test-output.txt](test-output.txt).

## Result

- **Command:** `pnpm -r --parallel --filter web --filter api --filter data-sync test`
- **Date run:** 2026-04-26
- **Total test files:** 18 (web 14, api 3, data-sync 1)
- **Total tests:** 169 (web 140, api 22, data-sync 7)
- **Passed:** 169
- **Failed:** 0

Per-package summary from the captured output:

| Package | Files | Tests | Passed | Failed | Duration |
|---------|-------|-------|--------|--------|----------|
| `apps/web` | 14 | 140 | 140 | 0 | 1.62 s |
| `apps/api` | 3 | 22 | 22 | 0 | 13.54 s |
| `apps/data-sync` | 1 | 7 | 7 | 0 | 287 ms |

## Known limitations

- The tests do not call SportMonks, SofaScore or any other live external
  provider; provider responses are exercised via fixtures and mocked
  `apiFetch` calls.
- The tests do not prove that the underlying provider data is objectively
  correct — only that the artefact handles it consistently and surfaces
  missing values rather than fabricating zeros.
- The tests do not replace manual browser verification of the rendered
  pages; they cover formatters, fetchers and small rendering primitives,
  not full end-to-end visual review.
- Coverage is intentionally focused on core logic and high-risk behaviours
  (mean-of-ratings, missing-data fallbacks, knockout-stage exclusion,
  season-aware fetching, coach `isCurrent` rules) rather than full line
  coverage.
- The API integration tests skip when no `DATABASE_URL` is configured, so
  the 22 API tests above include the integration suite only when run
  against an environment with a reachable database.

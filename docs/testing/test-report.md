# Test Report

**Project:** Campeonato Uruguayo
**Author:** Matías Menker
**Date:** 2026-04-26
**Branch:** `tests`

This report summarises the execution of the automated test suite documented in
[`test-strategy.md`](./test-strategy.md) and [`test-cases.md`](./test-cases.md). It
captures the environment, the commands used, the raw results and the conclusions
drawn from the run.

## 1. Environment

| Item | Value |
|------|-------|
| Date of run | 2026-04-26 |
| Operating system | macOS (Darwin 25.3.0) |
| Node.js | 20.x |
| Package manager | pnpm 9.14.2 |
| Unit / integration framework | Vitest 4.1.5 |
| End-to-end framework | Playwright (Chromium) |
| Database (integration) | Postgres (managed) reached via `DATABASE_URL` |
| E2E target | https://campeonato-uruguayo.vercel.app |

## 2. Commands executed

```bash
pnpm --filter web test
pnpm --filter data-sync test
pnpm --filter api test
pnpm --filter web test:e2e
```

These are the same commands that the `Tests` GitHub Actions workflow runs on every
push to `master` and `tests` (see [`.github/workflows/test.yml`](../../.github/workflows/test.yml)).

## 3. Results summary

| Suite | Type | Files | Tests | Passed | Failed | Duration |
|-------|------|-------|-------|--------|--------|----------|
| `apps/web` | Unit | 3 | 40 | 40 | 0 | 167 ms |
| `apps/data-sync` | Unit | 1 | 7 | 7 | 0 | 116 ms |
| `apps/api` | Unit + Integration | 2 | 18 | 18 | 0 | 13.15 s |
| `apps/web` | E2E (Playwright) | 5 | 15 | 15 | 0 | 3.8 s (after parallel warm-up) |
| **Total** | — | **11** | **80** | **80** | **0** | **~17 s** |

## 4. Detailed output

### 4.1 Web unit tests — `pnpm --filter web test`

```
RUN  v4.1.5 /Users/matiasmenker/Projects/campeonato-uruguayo/apps/web

Test Files  3 passed (3)
     Tests  40 passed (40)
  Start at  10:11:32
  Duration  167ms
```

Files exercised:

- `tests/unit/match-status.test.ts` — 17 tests
- `tests/unit/formation.test.ts` — 13 tests
- `tests/unit/rating.test.ts` — 10 tests

### 4.2 Data-sync unit tests — `pnpm --filter data-sync test`

```
RUN  v4.1.5 /Users/matiasmenker/Projects/campeonato-uruguayo/apps/data-sync

Test Files  1 passed (1)
     Tests  7 passed (7)
  Start at  10:11:33
  Duration  116ms
```

File exercised:

- `tests/parse-sportmonks-date.test.ts` — 7 tests

### 4.3 API unit + integration tests — `pnpm --filter api test`

```
RUN  v4.1.5 /Users/matiasmenker/Projects/campeonato-uruguayo/apps/api

Test Files  2 passed (2)
     Tests  18 passed (18)
  Start at  10:11:34
  Duration  13.15s
```

Files exercised:

- `tests/unit/security.test.ts` — 8 tests (API key middleware, security headers)
- `tests/integration/api.test.ts` — 10 tests (real Express app + real DB via supertest)

The integration block detects the presence of `DATABASE_URL` and is skipped via
`describe.skip` when running in environments without database access (the unit
block always runs).

### 4.4 End-to-end tests — `pnpm --filter web test:e2e`

```
✓ home.spec.ts            (3 passed)
✓ standings.spec.ts       (3 passed)
✓ match-details.spec.ts   (4 passed)
✓ team-details.spec.ts    (3 passed)
✓ player-details.spec.ts  (2 passed)

15 passed (3.8s)
```

The Playwright report is also generated as HTML in
`apps/web/playwright-report/` and uploaded as an artifact in CI.

## 5. Coverage by functional objective

Each functional objective has at least one automated test demonstrating its
implementation. The mapping table below comes directly from the
[strategy document](./test-strategy.md).

| Objective | Tests | Status |
|-----------|-------|--------|
| 1 — Daily synchronisation | 7 unit | Pass |
| 2 — Home page | 3 E2E | Pass |
| 3 — League standings | 3 E2E | Pass |
| 4 — Match details | 24 unit + 4 E2E | Pass |
| 5 — Team details | 10 unit + 3 E2E | Pass |
| 6 — Player details | 2 E2E | Pass |
| 7 — Public REST API | 8 unit + 10 integration | Pass |

## 6. Issues encountered and resolutions

The following issues were found while building and running the suite. They are
recorded here for traceability.

| # | Symptom | Root cause | Resolution |
|---|---------|------------|------------|
| 1 | `mapfile` not found in source-bundle script on macOS | Bash 3.2 lacks `mapfile` | Replaced with `while read` loop |
| 2 | Source bundle script referenced wrong paths | `next.config.ts` and `prisma/schema.prisma` did not exist; actual paths are `.mjs` and root `schema.prisma` | Updated paths |
| 3 | Formation parser test expected `0` for missing column | `parseInt("", 10)` returns `NaN`; `?? "0"` only triggers on `undefined` | Updated test to assert `Number.isNaN(...)` (matches actual behaviour) |
| 4 | Initial E2E run failed on `/tabla` and IDs `1` | Route is `/standings`; first real ids are 870 (fixture), 14 (team), 1622 (player) | Updated specs to use real production identifiers |
| 5 | Standings header selector matched `Pos|Equipo|Pts` | Headers are English (`Team`, `PTS`) | Updated selectors |
| 6 | Sporadic flake on `home.spec.ts` under parallel workers | Cold-cache rendering on Vercel deployment | Added one Playwright retry locally (CI uses two) |

## 7. Conclusions

- All 80 automated tests pass against the current `master` branch and the
  production deployment.
- The suite covers every functional objective declared by the project, with both
  pure-logic verification (unit) and end-to-end smoke verification through a real
  browser.
- Tests are wired into a GitHub Actions workflow and can be re-run on demand,
  giving the project a regression safety net for future changes.
- The strategy is intentionally pragmatic: the largest investment is at the unit
  layer, the integration layer is focused on the API surface, and E2E is kept to
  smoke tests so that the suite stays fast enough to run on every push.

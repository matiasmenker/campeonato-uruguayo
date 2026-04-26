# Test Strategy

**Project:** Campeonato Uruguayo
**Author:** Matías Menker
**Date:** 2026-04-26

## 1. Purpose

This document describes how the Campeonato Uruguayo platform is tested. It explains
which layers of the system are covered, which tools are used, how tests are organised
in the monorepo, and how the test suite is executed both locally and in CI. The
strategy is designed to prove that each functional objective of the project is
implemented and that the application keeps working as the codebase evolves.

## 2. System under test

The platform is a pnpm monorepo with three runtime applications and shared packages:

- `apps/web` — Next.js 16 server-rendered web application (consumer-facing).
- `apps/api` — Express HTTP API exposing standings, fixtures and player data.
- `apps/data-sync` — Node CLI that synchronises data from SportMonks into Postgres.
- `packages/db` — Prisma schema and generated client.
- `packages/sportmonks-client` — Typed wrapper over the SportMonks REST API.

The web and API apps are deployed to Vercel and Render respectively, with a managed
Postgres database.

## 3. Functional objectives covered

The TFG defines seven functional objectives. The test suite maps to them as follows:

| # | Objective | Test type | Test files |
|---|-----------|-----------|------------|
| 1 | Daily synchronisation from SportMonks | Unit | `apps/data-sync/tests/parse-sportmonks-date.test.ts` |
| 2 | Home page with live, finished and upcoming matches | E2E | `apps/web/tests/e2e/home.spec.ts` |
| 3 | League standings page | Unit + E2E | `apps/web/tests/e2e/standings.spec.ts` |
| 4 | Match details page | Unit + E2E | `apps/web/tests/unit/match-status.test.ts`, `apps/web/tests/unit/formation.test.ts`, `apps/web/tests/e2e/match-details.spec.ts` |
| 5 | Team details page | Unit + E2E | `apps/web/tests/unit/rating.test.ts`, `apps/web/tests/e2e/team-details.spec.ts` |
| 6 | Player details page | E2E | `apps/web/tests/e2e/player-details.spec.ts` |
| 7 | Public REST API with security headers | Unit + Integration | `apps/api/tests/unit/security.test.ts`, `apps/api/tests/integration/api.test.ts` |

## 4. Test pyramid

The strategy follows a classic pyramid: many fast unit tests at the base, a focused
integration layer in the middle, and a thin layer of end-to-end smoke tests that
exercise the production deployment.

### 4.1 Unit tests (Vitest)

Pure-logic functions are extracted to `lib/` modules so they can be tested without a
React or Next.js runtime. Coverage areas:

- Match status classifier (`live`, `finished`, `upcoming`) and live labels.
- Date and time formatting in the Montevideo timezone.
- Formation parsing (`"4-3-3"`, `"row:col"`).
- Player rating tier mapping (elite / excellent / good / ...).
- API security middleware (API key check, security headers).
- SportMonks date parser used by the daily sync.

### 4.2 Integration tests (Vitest + supertest)

The API is tested in-process with `supertest` against a real Express app instance.
When `DATABASE_URL` is present the suite hits a real Prisma client and verifies:

- `GET /` and `GET /health` system endpoints.
- API-key authentication on protected routes.
- `GET /api/v1/standings` and `GET /api/v1/fixtures/:id` shape and headers.
- Standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, hidden `X-Powered-By`).

If the database environment variable is missing, the integration block is skipped via
`describe.skip` so the suite still runs in CI environments without database access.

### 4.3 End-to-end tests (Playwright)

Playwright drives a real Chromium browser against the production deployment by
default (`https://campeonato-uruguayo.vercel.app`). The base URL can be overridden
with `PLAYWRIGHT_BASE_URL` to run against a local dev server.

E2E tests are intentionally smoke-style: they assert that each route returns HTTP
200, renders substantive content, exposes the expected headings or status badges and
does not raise runtime errors in the browser console. They are not full regression
tests; their job is to catch broken deploys and missing data.

## 5. Tooling

| Concern | Tool | Notes |
|---------|------|-------|
| Unit tests | Vitest 3 | One config per app: `apps/{web,api,data-sync}/vitest.config.ts` |
| HTTP integration | supertest | Used inside Vitest in `apps/api` |
| E2E browser | Playwright | Single chromium project, list + html reporters |
| CI | GitHub Actions | `.github/workflows/test.yml` |
| Package manager | pnpm 9.14.2 | Workspace filters `--filter web|api|data-sync` |

## 6. Running the tests

From the repository root:

```bash
pnpm test            # all unit + integration tests across apps
pnpm test:web        # web unit tests only
pnpm test:api        # API unit + integration tests
pnpm test:data-sync  # data-sync unit tests
pnpm test:e2e        # Playwright against production
```

Targeting a local server for the E2E suite:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e
```

## 7. Continuous integration

`.github/workflows/test.yml` defines two jobs:

1. **unit-and-integration** — installs dependencies, generates the Prisma client and
   runs the Vitest suites for all three apps.
2. **e2e** — runs Playwright against the production URL after the unit job passes
   and uploads the HTML report as an artifact.

The workflow runs on every push to `master` and `tests`, on pull requests targeting
`master`, and on manual `workflow_dispatch`.

## 8. Test data and stability

E2E tests use real production identifiers that are guaranteed to exist (fixture 98,
team 14, player 1622). Selectors are kept loose (regular expressions on visible text)
so that minor copy or styling changes do not break the suite. One Playwright retry is
configured locally (and two in CI) to absorb transient network variability when
hitting the public deployment.

## 9. Limitations and future work

- E2E coverage is smoke-only; deeper user-journey tests (login, filters, season
  switcher) are out of scope for this iteration.
- Visual regression is not part of the suite.
- Performance and load testing are tracked separately and not part of this strategy.

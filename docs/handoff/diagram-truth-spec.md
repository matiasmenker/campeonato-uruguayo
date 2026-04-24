# diagram-truth-spec

## 1. SYSTEM ARCHITECTURE TRUTH

The real current architecture, as implemented:

- **External data sources (real, in use):**
  - **SportMonks API v3** — primary structural and match data source. Used by the data-sync CLI (via `SPORTMONKS_API_TOKEN`) and also via a typed client package (`packages/sportmonks-client`). Covers countries, leagues, seasons, stages, rounds, venues, teams, players, squad memberships, transfers, coaches, referees, fixtures, fixture events, lineups, standings, fixture states.
  - **SofaScore (HTML + JSON endpoints via Playwright browser automation)** — secondary/enrichment source, used **only** by `sync:fill-stats`. The base URL is controlled by `EXTERNAL_STATS_URL` and defaults to `https://www.sofascore.com`. It scrapes per-player fixture statistics (minutes, rating, goals, assists, shots, passes, tackles, saves, crosses, duels, touches, etc.) for the current season and upserts them into `FixturePlayerStatistic` rows — mapped into SportMonks `statType` IDs via a hardcoded table.

- **Orchestration layer (real):**
  - **GitHub Actions** is the real scheduler. There is no cron daemon, no server-side scheduler, no Vercel cron. Four workflows exist:
    - `sync-base.yml` → runs `pnpm sync:base` (weekly, Sunday 04:00 UYT / 07:00 UTC).
    - `sync-daily.yml` → runs `pnpm sync:daily` (daily, 06:00 UYT / 09:00 UTC). Installs Playwright Chromium for `fill-stats`.
    - `sync-live.yml` → runs `pnpm sync:live` every 5 minutes within the active match window (08:00–02:59 UYT) via two cron entries.
    - `sync-health.yml` → runs `pnpm sync:health`. Triggered on `workflow_run` after Sync Daily and Sync Base complete (not on its own schedule).
  - Each workflow is a separate GitHub Actions job on `ubuntu-latest`. They all install pnpm + Node 20, generate the Prisma client, and run the sync command. All share `DATABASE_URL` and `SPORTMONKS_API_TOKEN` secrets.

- **Data-sync layer (real):**
  - A Node.js CLI at `apps/data-sync` dispatched via `tsx src/cli.ts <command>`. No compilation needed to run.
  - Sync functions live under `src/sync/*.ts`. Reports live under `src/reports/*.ts`.
  - The CLI writes to PostgreSQL through Prisma. It does not expose any HTTP interface.

- **Database:**
  - **PostgreSQL on Neon.** Schema managed by Prisma at `packages/db/schema.prisma`. Access is through the generated Prisma client (workspace package `db`).
  - Neon suspends on inactivity; a retry on first connection failure is expected behaviour.

- **Backend API (real):**
  - **Express 4 + TypeScript (ESM)** at `apps/api`. Uses Zod for request validation and Prisma for DB access.
  - Module layout is strict: every feature lives in `src/modules/<name>/` with `contracts.ts` (Zod schemas + response types), `repository.ts` (Prisma only), `service.ts` (orchestration), `mapper.ts` (DB → contract), `routes.ts` (thin Express router). Registered in `src/routes.ts`.
  - Secured by an `x-api-key` header middleware (`apps/api/src/http/security.ts`) plus CORS and rate limiting.
  - Deployed on **Render** at `api.campeonatouruguayo.com`.
  - Local default port: `3001`.

- **Frontend (real):**
  - **Next.js 16 App Router on React 19**, Turbopack, Tailwind v4 (oklch tokens), shadcn/ui primitives, `@tabler/icons-react`. Pages are mostly Server Components using async data fetching; client components only where interactivity is needed (selectors, carousels, matches-browser).
  - Server components call the backend via `apps/web/lib/api.ts` (`apiFetch`) which reads `API_BASE_URL` (set to `http://localhost:3001` in dev) and attaches the `x-api-key` header.
  - Future deployment: Vercel at `campeonatouruguayo.com`. Domain on Namecheap.
  - Local default port: `3000`.

- **User-facing layer:** the browser renders HTML/RSC served by Next.js. There is no native app. There is no websocket layer.

- **Component communication (real):**
  - Browser ⇄ Next.js (HTTPS).
  - Next.js Server Components ⇄ Express API (HTTPS, `x-api-key`).
  - Express API ⇄ Neon Postgres (Prisma).
  - GitHub Actions runners ⇄ Neon Postgres (Prisma, via `DATABASE_URL` secret).
  - GitHub Actions runners ⇄ SportMonks API (HTTPS, `SPORTMONKS_API_TOKEN`).
  - `sync:fill-stats` job → Playwright Chromium → SofaScore (HTML/JSON scraping).
  - The Next.js frontend also calls the public **YouTube Data API v3** directly from the home page to fetch the latest AUF channel videos (`apps/web/lib/youtube.ts`), with a hardcoded fallback list if the key is missing.

- **What the frontend does NOT access directly:**
  - It never touches SportMonks.
  - It never touches SofaScore.
  - It never runs Prisma.
  - It does not hold the database credentials.
  - It does not run sync jobs.

- **What should appear in a system architecture diagram:**
  - SportMonks API v3 (primary external source).
  - SofaScore (secondary/enrichment external source, only reached by `fill-stats`).
  - YouTube Data API v3 (only used by frontend home page for highlights).
  - GitHub Actions (orchestration layer with 4 workflows).
  - Data-sync CLI (runs inside each workflow).
  - Neon Postgres (database).
  - Express API on Render (backend).
  - Next.js on Vercel (frontend).
  - Browser (user).
  - `x-api-key` auth on the API boundary.

- **What should NOT appear:**
  - Any message broker / queue (there isn't one).
  - Any cache layer like Redis (there isn't one; caching is `next: { revalidate }` only).
  - Any cron server (GitHub Actions is the only scheduler).
  - Any Vercel cron or edge function (not used for syncs).
  - Any background worker service (not present).

---

## 2. SYNC ORCHESTRATION / EVENTUAL CONSISTENCY TRUTH

- **Triggering:** All syncs are triggered by GitHub Actions cron schedules or `workflow_dispatch`. There is no other scheduler.

- **Number of distinct sync workflows:** 4.
  1. **Sync Base** (`sync:base`) — weekly, Sundays 04:00 UYT. Up to 60 min timeout.
  2. **Sync Daily** (`sync:daily`) — every day 06:00 UYT. Up to 25 min timeout. Installs Playwright Chromium because it calls `sync:fill-stats` at the end.
  3. **Sync Live** (`sync:live`) — every 5 min during the active match window (08:00–02:59 UYT, split in two cron entries). 5 min timeout.
  4. **Sync Health** (`sync:health`) — triggered by `workflow_run` after Daily and Base complete. Also `workflow_dispatch`.

- **What each job does (per the actual source in `apps/data-sync/src/sync`):**
  - **`sync:base`** (`base.ts`) runs the full pipeline in this order, with no season filter (all covered seasons): `countries → types → leagues → seasons → venues → structure (stages+rounds+groups) → teams → coaches → referees → players → squad-memberships → states → fixtures → fixture-details → transfers → sidelined → standings`. Intended to backfill / reconcile everything.
  - **`sync:daily`** (`daily.ts`) resolves the current season from DB, then runs a **subset scoped to that season**: `seasons → structure → venues → referees → players → squad-memberships → coaches → transfers → sidelined → fixtures → fixture-details → standings`. Finally runs **`sync:fill-stats`** to enrich current-season per-player fixture statistics from SofaScore. Prints elapsed time.
  - **`sync:live`** (`live.ts`) targets today's fixtures only. Exits in ~2 s if no fixtures are scheduled for today, otherwise syncs fixture state, scores, events, lineups incrementally. Designed to be cheap and high-frequency.
  - **`sync:health`** (`health.ts`) runs a DB-vs-SportMonks reconciliation report, comparing structure, squads, fixtures (including finished vs. SportMonks `state_id=5`), score verification, events/lineups counts, standings and coaches. Produces a diagnostic summary; does not write to the DB.
  - **`sync:fill-stats`** (`fill-stats.ts`) is the **only** place SofaScore is used. It drives a Playwright Chromium instance against `EXTERNAL_STATS_URL` (defaults to `https://www.sofascore.com`), tournament ID `278`, and maps external stat keys (e.g. `goalAssist`, `savedShotsFromInsideTheBox`) into SportMonks `statType` IDs. Writes into `FixturePlayerStatistic`. Runs only for the current season.

- **Data domains each job updates:**
  - `base`: all domains, all seasons currently covered.
  - `daily`: all season-scoped domains for the current season + fill-stats enrichment.
  - `live`: fixture-level state, scores, events, lineups for today only.
  - `health`: nothing (read-only report).
  - `fill-stats`: fixture per-player statistics only.

- **Enrichment / fill-stats reality:**
  - `fill-stats` does exist and is wired into `sync:daily`. It is the only path that uses SofaScore. Its output feeds the same `FixturePlayerStatistic` table as SportMonks-sourced stats, using SportMonks `statType` IDs as the key. This is real in the final artefact.

- **SofaScore usage in final artefact:** Yes, used — via Playwright — inside `sync:fill-stats` only. It is not queried by the frontend, nor by the API, nor by any sync other than `fill-stats`. The env variable `EXTERNAL_STATS_URL` also appears referenced in `apps/data-sync/src/reports/data-status.ts`, but `data-status` is an investigation report, not a production workflow.

- **How post-match data becomes more complete over time:**
  - T+0 (match in progress): `sync:live` (every 5 min) updates state, score and events incrementally.
  - T+minutes after FT: later `sync:live` ticks and/or the next `sync:daily` refresh in/past-match data; fixture-details fills lineups and per-event player/team assignments.
  - T+hours / overnight: `sync:daily` runs at 06:00 UYT, re-fetches season-scoped fixtures/details/standings and then `sync:fill-stats` enriches per-player statistics from SofaScore. Standings tables catch up here.
  - T+days (Sunday): `sync:base` does a full reconciliation across all covered seasons, filling any gaps that per-season pipelines missed (historical fixes, changed squad memberships, late-arriving lineups, etc.).
  - `sync:health` runs automatically after Daily and Base, comparing DB vs SportMonks and surfacing discrepancies without writing anything.

- **Why "eventually consistent":** The DB is never a live mirror of SportMonks/SofaScore. Every data domain is hydrated by a periodic job on its own cadence (5 min, daily, weekly). Different tables therefore catch up at different times: live state moves in 5-minute ticks, full fixture detail and standings usually at the next daily run, and player-level fine-grained statistics via the post-daily `fill-stats` step. The platform converges on correctness over time rather than instantly, which is the textbook definition of eventual consistency.

- **What should appear in a sync flow diagram:**
  - GitHub Actions as the top-level scheduler.
  - The 4 workflows (Base, Daily, Live, Health) with their cron cadence.
  - The data-sync CLI commands they invoke.
  - SportMonks and SofaScore as the two real external sources, with SofaScore attached only to `fill-stats`.
  - Neon Postgres as the shared sink.
  - Playwright/Chromium as the browser runtime used inside `fill-stats`.
  - The `workflow_run` dependency from Daily/Base → Health.

- **What should NOT appear:**
  - Any queue, worker pool, pub/sub, Kafka, Redis or similar.
  - Any "live websocket" or push channel to the frontend.
  - Any manual migration step during sync (migrations are not executed by these workflows).
  - Any imaginary `sync:monthly` or `sync:hourly` job.

---

## 3. SIMPLIFIED DATA MODEL TRUTH

The real core data model (Prisma models in `packages/db/schema.prisma`) includes: `Country`, `City`, `League`, `Season`, `Stage`, `Round`, `Group`, `Venue`, `Referee`, `Team`, `Player`, `Coach`, `CoachAssignment`, `SquadMembership`, `Transfer`, `PlayerMarketValue`, `Injury`, `Suspension`, `Fixture`, `FixtureState`, `FixtureChangeLog`, `Event`, `Lineup`, `FixturePlayerStatistic`, `FixtureTeamStatistic`, `StatType`, `Standing`.

For a simplified report diagram the important entities and relationships are:

- **Central season-aware entities:**
  - `League` has many `Season`.
  - `Season` has many `Stage` (e.g. Apertura, Clausura, Intermediate Round, Intermediate Round - Final, Championship - Finals, Championship - Semi-finals). The UI groups these into four presentation buckets (`apertura`, `intermedio`, `clausura`, `finales`) but the DB is per-stage.
  - `Stage` has many `Round` and optionally `Group`.

- **Team/player/coach identity over time:**
  - `Team` is a stable entity.
  - `Player` is a stable entity.
  - `SquadMembership` is the **real season-aware resolver of which players belonged to which team in which season** — it has `(playerId, teamId, seasonId, positionId, shirtNumber, isLoan, from, to)`. A player can have multiple memberships in the same season (mid-season transfers — Maxi Gómez 2025 is a real example: Defensor Sporting + Nacional).
  - `Coach` has many `CoachAssignment`, each pointing at `(teamId, seasonId)`. This is how "who coached this team in this season" is resolved. In practice the API flattens assignments per coach across all seasons, so season-by-season filtering is inexact by design.
  - `Transfer` captures transfer events (`playerId, fromTeamId, toTeamId, date, …`); useful historically but not required to resolve "who played for whom this season" — that job belongs to `SquadMembership`.

- **Fixture and in-match facts:**
  - `Fixture` is central to match-level analytics and connects `Season`, `Stage`, `Round`, `Group`, `Venue`, `Referee`, `homeTeam`, `awayTeam`, `FixtureState`, plus denormalised `homeScore`, `awayScore`, `homeFormation`, `awayFormation`.
  - `FixtureChangeLog` records deltas/updates on the fixture (live ticks).
  - `FixtureState` is a lookup for state codes.
  - `Event` belongs to `Fixture` and points to `Player` and optional `relatedPlayer` — this is the source for goals, assists (via relatedPlayer on non-penalty goals), cards and substitutions.
  - `Lineup` belongs to `Fixture` and `Player`, with `teamId`, `typeId` (starter/bench), and formation coordinates (`formationField` "row:col" and legacy `formationPosition`). This is what the pitch rendering consumes.
  - `FixturePlayerStatistic` stores per-player per-fixture numeric stats keyed by `statType`, populated by both SportMonks (via `fixture-details`) and SofaScore (via `fill-stats`).
  - `FixtureTeamStatistic` stores per-team per-fixture numeric stats.
  - `StatType` is the lookup table for stat IDs (e.g. 52 Goals, 57 Saves, 79 Assists, 118 Rating, 119 Minutes Played).

- **League table facts:**
  - `Standing` is per `(season, stage, team)` and exposes position, played, W/D/L, GF, GA, GD, points. The UI uses it only for league-format stages; knockout stages (`Championship - Finals`, `Championship - Semi-finals`) return no standings and the UI falls back to showing fixtures.

- **Central to season-aware behaviour (must be in the diagram):**
  `Season` — `Stage` — `Round` — `SquadMembership` — `CoachAssignment` — `Fixture` — `Standing`.

- **Central to fixture-level analytics (must be in the diagram):**
  `Fixture` — `Event` — `Lineup` — `FixturePlayerStatistic` — `StatType`.

- **Is `SquadMembership` the real player-team-season resolver?** Yes. It is the single source of truth the web uses to answer "which team did this player belong to in this season?", including the multi-team case within a single season. `Transfer` complements it with the event-level record but is not the resolver.

- **What should appear in a simplified data model diagram:**
  - `League → Season → Stage → Round` hierarchy.
  - `Team`, `Player`, `Coach` as stable entities.
  - `SquadMembership` linking `Player`–`Team`–`Season` (the season-aware resolver).
  - `CoachAssignment` linking `Coach`–`Team`–`Season`.
  - `Fixture` linked to `Season`, `Stage`, `Round`, `Venue`, two `Team` (home/away), `Referee`, `FixtureState`.
  - `Event`, `Lineup`, `FixturePlayerStatistic` hanging off `Fixture` + `Player`.
  - `Standing` per `Season`×`Stage`×`Team`.
  - `StatType` as the lookup that unifies SportMonks-sourced and SofaScore-sourced stats.

- **What should NOT appear (to keep it "simplified"):**
  - `Country`, `City` (noise for this report).
  - `FixtureChangeLog` (internal audit trail of live ticks).
  - `PlayerMarketValue`, `Injury`, `Suspension` (peripheral).
  - `FixtureTeamStatistic` unless you also showcase team-level stats (the web surfaces mostly `FixturePlayerStatistic`).
  - `Transfer` if the diagram is focused on who-plays-where-this-season (SquadMembership answers that).

---

## 4. REAL NAMES TO USE IN DIAGRAMS

- External providers:
  - `SportMonks API v3`
  - `SofaScore (via Playwright / HTML+JSON scraping)`
  - `YouTube Data API v3`
- Orchestration layer:
  - `GitHub Actions`
- Sync processes / workflows:
  - `Sync Base — sync:base (weekly)`
  - `Sync Daily — sync:daily (daily)`
  - `Sync Live — sync:live (every 5 min, match window)`
  - `Sync Health — sync:health (after Daily/Base)`
- Enrichment process:
  - `Fill Stats — sync:fill-stats (Playwright / SofaScore)`
- Database:
  - `PostgreSQL on Neon`
  - Access layer: `Prisma (packages/db)`
- Backend:
  - `Express API (apps/api) — Render deployment`
- Frontend:
  - `Next.js 16 App Router (apps/web) — Vercel deployment`
- Key data entities (for the simplified ER diagram):
  - `League`, `Season`, `Stage`, `Round`
  - `Team`, `Player`, `Coach`
  - `SquadMembership`, `CoachAssignment`
  - `Fixture`, `FixtureState`, `Event`, `Lineup`
  - `FixturePlayerStatistic`, `StatType`
  - `Standing`

---

## 5. IMPORTANT CAVEATS

- **GitHub Actions is the only scheduler.** There is no Vercel cron, no Render cron, no self-hosted cron daemon.
- **SofaScore is used only inside `sync:fill-stats`**, and `fill-stats` only runs as the last step of `sync:daily`. It is not wired into `sync:base` or `sync:live`, and neither the API nor the frontend touches it directly.
- **The frontend never touches SportMonks or SofaScore.** It reaches them only transitively through the API (for SportMonks-originated data) or through the data-sync DB writes. SofaScore-sourced rows are indistinguishable at the API boundary because they are stored in the same `FixturePlayerStatistic` table under the same `StatType` IDs.
- **The API is gated by `x-api-key`.** Server-side fetches from Next.js attach this header via `apps/web/lib/api.ts`. The browser never holds the key.
- **YouTube Data API v3 is called from the frontend home page only**, for channel highlights, with a hardcoded in-code fallback list when the key is missing. It is not part of the sync pipeline and should be drawn as a frontend-only arrow.
- **Eventual consistency is real, not aspirational.** Different tables converge on different cadences (5 min / daily / weekly), so a per-minute "live" score and the per-fixture player-statistics can legitimately be out of sync within the same fixture for a short period after full time.
- **`SquadMembership` is the only correct resolver for "which team did this player belong to in this season".** Season-level aggregates in the UI (career-history rows, hero team detection) rely on it and on cross-referencing actual fixture appearances when a player had more than one membership in the same season. Do not diagram "player.team_id" as if that field existed — it does not.
- **`CoachAssignment` data is per (team, season) but is often denormalised by the API into "all coaches who ever touched this team tagged to every season"**, so the UI has to narrow down to the actually-active coach using the `isCurrent` flag on the assignment. Any diagram caption should note that season-to-active-coach mapping is a best-effort resolution, not an authoritative field.
- **Knockout stages (`Championship - Finals`, `Championship - Semi-finals`, `Intermediate Round - Final`) have no `Standing` rows**, by design. The UI falls back to showing `Fixture` cards in the standings page for those stages. Do not imply a league table exists for them.
- **`report:data-status` and `report:fixture-players` are diagnostic CLI reports, not production sync jobs.** They should not appear in an orchestration diagram.
- **`packages/sportmonks-client`** is a typed HTTP client consumed by the data-sync CLI. It is not itself a service; in diagrams it is an implementation detail of the sync layer.

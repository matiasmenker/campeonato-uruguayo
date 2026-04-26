# Test Cases

**Project:** Campeonato Uruguayo
**Author:** Matías Menker
**Date:** 2026-04-26

This document lists every automated test case in the suite, grouped by the
functional objective it verifies. Each entry includes the test file, the test name,
the type, and the expected outcome.

Legend: U = Unit, I = Integration, E = End-to-end.

## Objective 1 — Daily synchronisation

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O1-U1 | U | `apps/data-sync/tests/parse-sportmonks-date.test.ts` | parses a valid SportMonks date string into a UTC Date | Returns `Date` with the same UTC components |
| O1-U2 | U | id. | returns `null` for `null` input | Function returns `null` |
| O1-U3 | U | id. | returns `null` for `undefined` input | Function returns `null` |
| O1-U4 | U | id. | returns `null` for an empty string | Function returns `null` |
| O1-U5 | U | id. | returns `null` for an invalid date string | Function returns `null` |
| O1-U6 | U | id. | accepts ISO date format | Returns matching `Date` |
| O1-U7 | U | id. | preserves the time component | Hours/minutes/seconds match input |

## Objective 2 — Home page

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O2-E1 | E | `apps/web/tests/e2e/home.spec.ts` | loads with HTTP 200 and renders without runtime errors | Status 200, no `pageerror` events |
| O2-E2 | E | id. | shows main navigation entries | Document title matches `/Campeonato/i` |
| O2-E3 | E | id. | renders the matches carousel section | `body` text length > 500 |

## Objective 3 — League standings

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O3-E1 | E | `apps/web/tests/e2e/standings.spec.ts` | loads `/standings` with HTTP 200 | Response status 200 |
| O3-E2 | E | id. | renders standings table headers | "Team" and "PTS" headers visible |
| O3-E3 | E | id. | displays known Uruguayan team names | At least two of Peñarol, Nacional, Defensor, Liverpool, Danubio appear |

## Objective 4 — Match details

Unit tests for the helpers that drive the match details and match-card UI:

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O4-U1 | U | `apps/web/tests/unit/match-status.test.ts` | classifies `INPLAY_1ST_HALF` as live | `getMatchStatus` returns `"live"` |
| O4-U2 | U | id. | classifies `HT` as live | `"live"` |
| O4-U3 | U | id. | classifies `INPLAY_2ND_HALF` as live | `"live"` |
| O4-U4 | U | id. | classifies `EXTRA_TIME` as live | `"live"` |
| O4-U5 | U | id. | classifies `PEN_LIVE` as live | `"live"` |
| O4-U6 | U | id. | classifies `FT` as finished | `"finished"` |
| O4-U7 | U | id. | classifies `AET` as finished | `"finished"` |
| O4-U8 | U | id. | classifies `FT_PEN` as finished | `"finished"` |
| O4-U9 | U | id. | classifies `NS` as upcoming | `"upcoming"` |
| O4-U10 | U | id. | classifies unknown codes as upcoming | `"upcoming"` |
| O4-U11 | U | id. | returns the "Half time" label for `HT` | `getLiveLabel` returns `"Half time"` |
| O4-U12 | U | id. | returns the "Penalties" label for `PEN_LIVE` | `"Penalties"` |
| O4-U13 | U | id. | returns the "Extra time" label for `EXTRA_TIME` | `"Extra time"` |
| O4-U14 | U | id. | returns "Live" for first half | `"Live"` |
| O4-U15 | U | id. | returns "Live" for second half | `"Live"` |
| O4-U16 | U | id. | formats kickoff date in Montevideo timezone | Day name + numeric day visible |
| O4-U17 | U | id. | formats kickoff time as HH:mm | `formatKickoffTime` returns matching string |
| O4-U18 | U | `apps/web/tests/unit/formation.test.ts` | parses `"3:2"` cell coordinates | `{row: 3, col: 2}` |
| O4-U19 | U | id. | returns NaN for missing components | `Number.isNaN` for missing side |
| O4-U20 | U | id. | parses "4-3-3" formation rows | `[4, 3, 3]` |
| O4-U21 | U | id. | parses "4-2-3-1" formation rows | `[4, 2, 3, 1]` |
| O4-U22 | U | id. | returns empty array for null/undefined | `[]` |
| O4-U23 | U | id. | filters non-numeric tokens | Discards `NaN` values |
| O4-U24 | U | id. | filters zero rows | Discards `0` values |

End-to-end tests that hit the live match page in production:

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O4-E1 | E | `apps/web/tests/e2e/match-details.spec.ts` | loads `/matches/98` with HTTP 200 | Status 200 |
| O4-E2 | E | id. | renders both team names on the match page | Body text length > 800 |
| O4-E3 | E | id. | renders a status badge | "Finished", "Live", "Upcoming", "Half time" or "Penalties" visible |
| O4-E4 | E | id. | returns 200 (or notFound) for an out-of-range match id | Status 200 or 404 |

## Objective 5 — Team details

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O5-U1 | U | `apps/web/tests/unit/rating.test.ts` | maps 9.5 to elite blue tier | Returns elite-blue tier |
| O5-U2 | U | id. | maps 9.0 boundary to elite blue tier | Returns elite-blue tier |
| O5-U3 | U | id. | maps 8.5 to excellent tier | Returns excellent tier |
| O5-U4 | U | id. | maps 8.0 boundary to excellent tier | Returns excellent tier |
| O5-U5 | U | id. | maps 7.5 to good tier | Returns good tier |
| O5-U6 | U | id. | maps 7.0 boundary to good tier | Returns good tier |
| O5-U7 | U | id. | maps 6.5 to average tier | Returns average tier |
| O5-U8 | U | id. | maps 5.0 to poor tier | Returns poor tier |
| O5-U9 | U | id. | maps `null` rating to neutral tier | Returns neutral tier |
| O5-U10 | U | id. | maps `undefined` rating to neutral tier | Returns neutral tier |
| O5-E1 | E | `apps/web/tests/e2e/team-details.spec.ts` | loads `/teams/14` with HTTP 200 | Status 200 |
| O5-E2 | E | id. | renders team hero section with substantial content | Body text length > 800 |
| O5-E3 | E | id. | does not produce runtime errors in console | No `pageerror` events |

## Objective 6 — Player details

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O6-E1 | E | `apps/web/tests/e2e/player-details.spec.ts` | loads `/players/1622` with HTTP 200 | Status 200 |
| O6-E2 | E | id. | renders player profile content | Body text length > 500 |

## Objective 7 — Public REST API

Unit tests for security middleware:

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O7-U1 | U | `apps/api/tests/unit/security.test.ts` | apiKeyAuth — passes through when no API_KEY env var | `next()` is called |
| O7-U2 | U | id. | apiKeyAuth — allows public root path | `next()` is called |
| O7-U3 | U | id. | apiKeyAuth — allows public `/health` path | `next()` is called |
| O7-U4 | U | id. | apiKeyAuth — rejects missing key | Responds 401 |
| O7-U5 | U | id. | apiKeyAuth — rejects wrong key | Responds 401 |
| O7-U6 | U | id. | apiKeyAuth — accepts correct key | `next()` is called |
| O7-U7 | U | id. | securityHeaders — sets `X-Content-Type-Options` and `X-Frame-Options` | Both headers set |
| O7-U8 | U | id. | securityHeaders — removes `X-Powered-By` | Header is unset |

Integration tests that hit a real Express app with a real database (skipped when
`DATABASE_URL` is missing):

| ID | Type | File | Test name | Expected outcome |
|----|------|------|-----------|------------------|
| O7-I1 | I | `apps/api/tests/integration/api.test.ts` | `GET /` — returns service descriptor | Status 200, JSON body |
| O7-I2 | I | id. | `GET /health` — returns ok | Status 200, `{status: "ok"}` |
| O7-I3 | I | id. | rejects `/api/v1` paths without API key (when API_KEY set) | Status 401 |
| O7-I4 | I | id. | accepts `/api/v1` paths with API key | Status 200 or 404, never 401 |
| O7-I5 | I | id. | `GET /api/v1/standings` returns array of standings | Status 200, array body |
| O7-I6 | I | id. | `GET /api/v1/fixtures/:id` returns fixture for a real id | Status 200, fixture id matches |
| O7-I7 | I | id. | `GET /api/v1/fixtures/:id` returns 404 for unknown id | Status 404 |
| O7-I8 | I | id. | sets `X-Content-Type-Options: nosniff` | Header present |
| O7-I9 | I | id. | sets `X-Frame-Options: DENY` | Header present |
| O7-I10 | I | id. | hides `X-Powered-By` | Header absent |

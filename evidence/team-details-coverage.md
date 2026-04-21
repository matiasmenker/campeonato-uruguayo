# Team Details — Data Coverage Evidence

_Generated: 2026-04-21T20:30:36.299Z_

## 1. Team-Season Coach Coverage

| Field | Count | % |
|-------|------:|--:|
| Total team-season combos | 64 | — |
| With coach | 64 | 100.0% |
| Without coach | 0 | 0.0% |

## 2. Team-Season Squad Coverage

| Field | Count | % |
|-------|------:|--:|
| Total team-season combos | 64 | — |
| With >= 11 players | 64 | 100.0% |
| With < 11 players | 0 | 0.0% |

## 3. Shirt Number Coverage

| Field | Count | % |
|-------|------:|--:|
| Total squad entries | 2991 | — |
| With shirt number | 2678 | 89.5% |
| Without shirt number | 313 | 10.5% |

## 4. Player Image Coverage

| Field | Count | % |
|-------|------:|--:|
| Total squad entries | 2991 | — |
| With real image | 1816 | 60.7% |
| With placeholder image | 1135 | 37.9% |
| No image (null) | 40 | 1.3% |

## 5. Short Interpretation

Coach and squad presence are complete across all team-season combinations in the database — the Team Details screen will never render an empty squad or missing coach for any synced team.

The main limitation is **player biographical depth**: approximately half of all squad entries lack date of birth, height, and nationality, causing the Age, Height, and Nationality columns to show `—` for roughly one in two players. This gap is systematic and correlates with how thoroughly SportMonks covers individual players in low-profile leagues.

Player image coverage is also partial: 38% of squad entries carry a SportMonks placeholder image (treated as no image by the UI), meaning real photo coverage is effectively ~61%.
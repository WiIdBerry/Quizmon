# Phase 4.1 Sprint 3

Build: `4.1-sprint3-v1`  
Public version: `Beta 1.3`

## Implemented

- One deterministic daily Who's That Pokémon round per UTC date
- Identical target, hint order and medium difficulty for every installation
- Five lives and one scored completion per day
- Monotonic trusted date to prevent simple local-clock rollback replays
- Offline completion with a bounded upload queue
- Anonymous installation identifier and configurable central API adapter
- Distribution view for clues 1–5 and unsolved rounds when backend data is available
- Honest pending state while no central service is configured
- Points and XP based on difficulty and clue position
- Personal totals, solve rate, average clues, first-clue wins and personal best
- Per-difficulty statistics in the persisted data model
- Duplicate completion protection for XP and statistics
- Desktop and mobile layouts for daily cards, statistics and results

## Central service contract

Set the `quizmon-daily-api` meta value in `index.html` to the deployed API base URL.

- `POST /v1/wttp/:date/results` with `{ installationId, bucket, seedVersion }`
- `GET /v1/wttp/:date/distribution` returning `{ counts: { hint1, hint2, hint3, hint4, hint5, lost } }`

No guessed Pokémon names, trainer names or profile data are transmitted.

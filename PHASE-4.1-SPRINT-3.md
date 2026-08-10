# Phase 4.1 Sprint 3

Build: `4.1-sprint3-v8`  
Public version: `Beta 1.3`

## Implemented

- Replaces the skip action with Give up only after all five clues have been revealed
- Giving up ends and persists the round as lost without falsifying the remaining-life count
- Prefers an MP3 cry source for iOS compatibility and retains the existing OGG source as a fallback
- Starts cry playback directly from the user gesture without requiring preloaded media metadata
- Caches successful Pokémon Showdown MP3 responses through the existing bounded runtime cache
- Rebuilt the active round as one vertical hierarchy: mystery Pokémon, active and discovered clues, then the answer field
- Replaced the in-round Pokéball question-mark graphic with the approved transparent PokéIdle symbol
- Removed the marked progress sentence, current-clue label, stage prompt, explanatory risk copy and skip-score subline
- Restored the approved PokéIdle symbol automatically when a visual clue cannot be loaded
- Simplified the setup overlay by removing the marked meta labels, supporting copy, per-difficulty descriptions, rules card and setup statistics card
- Replaced the generic Pokéball question-mark graphic with the approved transparent neutral-creature PokéIdle symbol
- Preserved daily play, all three difficulty selectors, the start action, persisted statistics and every round mechanic
- Every active clue except clue 5 can be skipped to reveal the next clue without losing a life
- A wrong guess still costs one life and reveals the next clue; skips and wrong guesses are tracked separately
- Points and XP are determined by difficulty and the highest revealed clue plus the existing fixed Daily bonus, never by remaining lives
- The live score preview shows the reduced value before a voluntary clue skip is confirmed
- Skipped clue progress survives save, restart and state repair
- Easy now follows one fixed accessible progression: full cry, light fact, clear fact, full shadow, large colour crop
- The easy cry plays to its natural end instead of being cut to a short excerpt
- The final easy crop uses a central artwork focus so it remains a stronger last chance than the shadow
- Every easy media clue has a separate data fallback for muted, offline or failed media
- Medium, Hard and the medium Daily round retain their existing varied clue selection
- Search suggestions stay in the document flow and can no longer cover the confirm action
- A complete Pokémon selection visibly enables one persistent confirm button; Enter uses the same path
- The active clue is presented as the central game stage instead of one row in a five-card list
- A compact five-step rail replaces four large locked placeholder cards
- The currently attainable point score is visible throughout the round
- Wrong guesses now reveal a comparison trail for generation, type overlap, height and weight
- Previously revealed clues remain available in a compact trail below the active stage
- Focused motion, stronger round hierarchy and responsive desktop/mobile layouts
- Public mode name changed consistently to PokéIdle
- Active free rounds can be left directly for the difficulty selection
- Media pairs are ordered by increasing reveal strength; a crop can no longer follow a fuller visual clue
- A won daily PokéIdle completes the main-menu daily training goal and checks off the current day
- One deterministic daily PokéIdle round per UTC date
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

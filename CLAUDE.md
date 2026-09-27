# Wolf Sudoku

Mobile-first Sudoku web game for Matt (Wolf Creative).
Matt is not a developer. Explain everything in plain language and give exact commands, one at a time.

## Stack
- Vite + React + TypeScript + Tailwind CSS
- No backend, no database. All saving uses localStorage through src/lib/storage.ts
- Tests: Vitest
- Icons: lucide-react
- Hosting: private GitHub repo `wolf-sudoku` -> Vercel auto-deploys every push to main

## Running locally (pm2 only, never plain `npm run dev`)
- Port 3020 with strictPort. Ports already used on this Mac: 3000, 3001, 3003, 3010, 3011, 3012, 4000. Never use them.
- Start: `pm2 start ecosystem.config.cjs && pm2 save`
- Restart: `pm2 restart wolf-sudoku`
- Stop: `pm2 stop wolf-sudoku`
- Logs: `pm2 logs wolf-sudoku --lines 50`
- Mac: http://localhost:3020 | Phone on same wifi: http://<Mac IP>:3020

## Folder structure
```
src/
  App.tsx           switches screens (home | game) with React state, no router
  screens/Home.tsx
  screens/Game.tsx
  components/       Board, Cell, NumberPad, Toolbar, StatsPanel, WinOverlay, SettingsPanel
  lib/sudoku.ts     generator, solver, helpers (pure functions, no React)
  lib/storage.ts    all localStorage access, typed and versioned
  lib/*.test.ts     Vitest tests
```

## Locked decisions
- Board = array of 81 numbers, 0 = empty.
- Clue targets: Easy 40-45, Medium 32-36, Hard 28-31, Expert 24-27. Every puzzle has exactly one solution. Generation under 1 second on a phone.
- Mistakes are counted but never end the game, unless Settings > 3-strike mode is on (off by default).
- Hint fills the selected cell if empty or wrong, otherwise a random empty cell. Adds to hintsUsed.
- Undo reverses entries, erases, notes and hints. It does not reduce the mistake count.
- Starting a new game while one is in progress asks first, then records a loss.
- Stats are per difficulty only (no "All" tab). Home opens on the last-played difficulty.
- Average time counts winning games only. Recent games keeps the last 10 per difficulty.
- Streak = consecutive local days with at least one win. One overall number. Shows 0 if the last win was before yesterday.
- localStorage keys: `wolf-sudoku:game`, `wolf-sudoku:stats`, `wolf-sudoku:settings`

## Design (Wolf Creative dark-gold)
- Background #0d0d0b | surface #1a1a16 | border #2a2a24
- Gold accent #c9a84c | text #f2efe6 | muted #8a877c | error #e05a4f
- Given numbers: cream, medium weight. Player numbers: gold. Wrong numbers: red.
- Mobile first (390px wide). Max width 440px, centered on laptop. Tap targets at least 44px.
- System UI font. No emoji. Sentence case labels. No em dashes in any UI text.

## Rules for Claude Code
- Read this file at the start of every session.
- Keep sudoku.ts and storage.ts free of React. UI never touches localStorage directly.
- Run `npm test` and `npm run build` before every commit. Fix failures first.
- Commit at the end of each phase: `Phase N: description`.
- Do not install new packages without saying why.
- Do not change files outside the current phase unless asked.
- After completing each task, tell me clearly: what you did, what you created or changed, and what the next step is. If you run into a decision that requires my input, give me two options with your recommendation.

## Build status
- [x] Phase 1: Scaffolding
- [x] Phase 2: Game logic and storage
- [ ] Phase 3: Game screen
- [ ] Phase 4: Home, stats, win screen, settings
- [ ] Phase 5: Deploy to Vercel
- [ ] Phase 6: Polish
Update this checklist at the end of each phase.

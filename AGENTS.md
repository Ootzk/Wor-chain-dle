# Wor-chain-dle Agent Guide

Wordle meets word chain: guess a hidden word while chaining letters in a snake pattern.

This is the canonical guide for coding agents working in this repository. Tool-specific entrypoints such as `CLAUDE.md` should import this file and keep only tool-specific notes.

Based on the [AnyLanguage-Word-Guessing-Game](https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game) fork.

## Tech Stack

- React 17 + TypeScript + Tailwind CSS 3
- Create React App (`react-scripts` 5)
- React Router v5 (`HashRouter`)
- Temporal API (`temporal-polyfill`) for DST-safe local-date handling; do not replace with `Date`
- i18next with bundled locale JSON files (`en`, `ko`, `ja`, `es`, `sw`, `zh`, `de`)
- Playwright E2E tests for desktop and mobile browsers
- GoatCounter analytics
- GitHub Actions deployment to GitHub Pages

## Project Structure

```text
src/
  index.tsx                       HashRouter routes (/, /practice, /event, /create, /custom/:code)
  App.tsx                         main game flow and input handlers
  i18n.ts                         i18next setup with bundled locale resources
  locales/{lang}/translation.json translations
  constants/
    config.ts                     game config, payment URLs, PATCH_NOTES_VERSION
    orthography.ts                valid character system
    wordlist.ts                   shuffled answer words, currently 2,315 entries
    validGuesses.ts               allowed guess words, currently 10,656 entries
  lib/
    achievementProgress.ts        achievement progress localStorage helpers
    words.ts                      daily word selection and word validation
    statuses.ts                   correct/present/absent status calculation
    chain.ts                      chain-rule and dead-end helpers
    share.ts                      share text generation
    events.ts                     active Event slot definition and seeded Event word selection
    eventCollectibles.ts          Event collectible targets, collection, and dashboard formatting
    eventResults.ts               Event per-version results, detail stats, and localStorage helpers
    dailyResults.ts               canonical Daily per-date results, loss reasons, and migration
    dailyHistory.ts               legacy Daily history migration and attendance helpers
    playStats.ts                  in-game detail stats, tile counts, and summaries
    profileTransfer.ts            WCD1 profile export/import public schema
    resultStats.ts                shared result-to-summary aggregation helpers
    loseReasons.ts                default and Event-specific loss reason helpers
    pacman.ts                     moving actor path helpers for Pacman-style Events
    patchNotes.ts                 user-facing patch note content
    releaseMetadata.ts            release dates and themes
    calendarMilestones.ts         Calendar-visible release/data milestones
    customPuzzle.ts               Custom puzzle URL-safe Base64 codec
    tokenizer.ts                  orthography-aware tokenization
    achievements.ts               achievement definitions and unlock engine
    cosmetics.ts                  cosmetic definitions, options, and equipment
    rewardMetadata.ts             release metadata for achievements and cosmetics
  components/
    alerts/                       alert presentation
    grid/                         game grid and chain bridge UI
    keyboard/                     QWERTY keyboard and physical-key handling
    calendar/                     monthly Daily history UI
    events/                       Event guide, Event Records panels, and season components
    achievements/                 achievement list and progress UI
    cosmetics/                    shared cosmetic previews
    rewards/                      Rewards modal panels for achievements and cosmetics
    stats/                        Records modal stat panels and share controls
    modals/                       Info, Stats, Rewards, Settings, Donate, Patch Notes
    modes/                        mode badge UI
    pages/                        Create Puzzle page
docs/
  events/                         season-specific Event guide markdown linked from README
e2e/
  fixtures/game.fixture.ts        Playwright helpers and fixtures
  *.spec.ts                       E2E coverage
scripts/
  generate-readme-screenshots.spec.ts
  readme-screenshots.config.ts
  shuffle-wordlist.js
```

## Development Commands

```bash
npm install
PUBLIC_URL=/ npm start
PUBLIC_URL=/ npm run build
npm test
npm run lint
npm run fix
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:mobile
npm run readme:screenshots
```

`package.json` has a GitHub Pages `homepage`, so local dev and local production builds should use `PUBLIC_URL=/` or asset paths may be wrong. The local dev server is normally `http://localhost:3000`.

Docker:

```bash
docker build -t wor-chain-dle .
docker run -d -p 3000:3000 wor-chain-dle
```

## Testing

- `npm run lint` checks Prettier formatting for `src`.
- `npm test` runs unit tests through CRA.
- `npm run test:e2e` runs Playwright. CI uses a prebuilt app served with `npx serve -s build -l 3000`; local E2E should build before serving when testing production behavior.
- E2E fixtures suppress the one-time Patch Notes modal by setting `seenPatchNotesVersion`.
- Playwright tests rely on `page.clock.setFixedTime()` for deterministic local-time behavior; `Temporal.Now` follows that mocked clock.
- Local production-style E2E uses `npm run build && npx serve -s build -l 3000`.
- CI runs Playwright serially with one worker.

Playwright projects are configured in `playwright.config.ts` for Desktop Chrome, Desktop Safari, iPhone 13, and Pixel 5.

E2E fixtures live in `e2e/fixtures/game.fixture.ts`. Important helpers include `gamePage`, `typeWord()`, `submitWord()`, `getRowCells()`, `waitForGameReady()`, `screenshot()`, and the Custom puzzle encoding mirror.

Key E2E files:

- `game-flow.spec.ts`: win/loss flows, validation alerts, status colors.
- `chain-rule.spec.ts`: chain validation, dead ends, turn pattern.
- `keyboard-input.spec.ts`: physical keyboard and IME behavior.
- `mobile-responsive.spec.ts`: responsive layout and touch interaction.
- `modals.spec.ts`: modal behavior by mode, including language popup behavior.
- `achievements-cosmetics.spec.ts`: achievements tab, unlock state, retro unlocks, cosmetic picker and share emoji behavior.
- `calendar.spec.ts`: calendar modal, month navigation, win/loss indicators, sharing.
- `event-mode.spec.ts`: Event route, Summer Garden rules, Event Records, Event Rewards, and Event-specific loss/progress behavior.
- `share-exclude-url.spec.ts`: URL exclusion from share text.
- `navigation.spec.ts`: route transitions and page navigation.
- `local-timezone.spec.ts`: local-timezone daily reset and dailyHistory migration.
- `daily-results-migration.spec.ts`: v1.6.0-style Daily history migration into `dailyResults`, Calendar rendering, and Unknown loss reasons.

Choose verification based on risk. Documentation-only changes do not need the full test suite unless they touch generated docs or scripts.

## Deployment

- Pull requests run `test`; PRs targeting `main` also run E2E.
- Pushes to `main` deploy to `gh-pages`, create a version tag from `package.json`, and create a GitHub Release.
- The GitHub Release body is generated from the merged release PR body.
- Playwright HTML reports are kept as GitHub Actions artifacts for 30 days.
- Manual deployment is available with `npm run deploy`.

## Project Management

- GitHub Project Board: <https://github.com/users/Ootzk/projects/3>
- Track planned work as GitHub issues when possible.
- If a change starts ad hoc, still group related work into a PR and assign the relevant release milestone.
- Dictionary-related work is intentionally backlog unless the developer explicitly reprioritizes it.

## Branching And PRs

- `main`: always deployable. Merges create version tags and GitHub Releases.
- `release/{version}`: release integration branch created from `main`.
- Feature branches are created from the target release branch and PR back into that release branch.
- Release branches PR into `main`.
- Release PR titles must be `Release v{version}`.
- PR merges are always performed by the developer, not by agents.
- Feature PRs are squash-merged. Prefer adding follow-up commits instead of amending existing commits, except for truly tiny local-only fixes before review.
- Always pass `--repo Ootzk/Wor-chain-dle` to `gh pr create` and other GitHub CLI commands that can infer a repository. This repo has an upstream fork remote, so implicit repo detection can target the wrong repository.
- Use full semantic versions in branch names, issue/PR text, screenshots, and docs. Write the full form such as `v1.7.0`; do not omit the patch component.

Required PR metadata:

- Labels matching the change type. Available labels include:
  - `development: enhancement`: new standalone feature, such as a new game mode, dictionary feature, or major tool.
  - `development: reorganize`: reposition or restructure existing user-facing features, such as moving Achievements and Cosmetics into a Rewards experience.
  - `development: content`: content added to existing systems, such as achievements, cosmetics, words, or patch notes.
  - `development: refactor`: internal code restructuring without intended user-facing behavior changes.
  - `development: devops`: development environment, CI, deployment, tooling, or agent workflow changes.
  - `🐛 bug`: bug fix.
  - `📝 documentation`: documentation.
  - `🎨 UI/UX`: design or UI improvement.
  - `💰 donation`: donation-related change.
  - `🔖 versioning`: release-to-main PRs.
  - `🏆 rewards`: Achievements, Cosmetics, unlocks, and reward-related UX.
  - `💥 breaking change`: incompatible behavior.
  - `🌐 i18n`: translations or locale behavior.
  - `browser: chrome`, `browser: safari`: browser-specific change.
  - `platform: PC`, `platform: mobile`: platform-specific change.
- Use new labels for new and ongoing work only. Do not retroactively label already-completed historical issues or PRs unless the developer explicitly asks. The `development:*` label taxonomy migration was a one-time exception.
- Assignee: `Ootzk`.
- Milestone: target release version such as `v1.7.0`. Create the milestone first if it does not exist.
- Feature PR body should include related issues with `Closes #issue` as a reference. Because feature PRs target release branches, GitHub may not auto-close those issues until the release PR.
- Release PR body should list every issue completed in the release with `Closes #issue`; this body becomes the GitHub Release text.
- GitHub API limitations mean feature PRs targeting release branches may need manual Development sidebar linking.

## Version Management

Version values live in:

- `package.json` `version`
- `src/constants/config.ts` `PATCH_NOTES_VERSION`

When preparing a release branch for `main`, update both values. The Claude-specific `/bump-version` skill performs this as:

```bash
npm version <version> --no-git-tag-version
```

Then update `PATCH_NOTES_VERSION` to the same version. The README release badge is dynamic and does not need a manual version edit.

When referring to versions in prose, use the full semver form with the `v` prefix for release labels, for example `v1.7.0`. Use the bare semver form only where code/config expects it, for example `PATCH_NOTES_VERSION = '1.7.0'`.

## Game Modes

| Item                   | Daily                                                  | Practice             | Event                       | Custom                |
| ---------------------- | ------------------------------------------------------ | -------------------- | --------------------------- | --------------------- |
| Answer source          | `WORDS`, local midnight reset                          | random `WORDS` entry | active Event seeded `WORDS` | creator-selected word |
| Stats                  | aggregate `gameStats`; date/detail `dailyResults`      | none currently       | per-version `eventResults`  | `customGameStats`     |
| Daily history          | `dailyResults`; legacy `dailyHistory` migrates into it | no                   | no                          | no                    |
| Game state persistence | yes                                                    | no                   | yes                         | no                    |
| Share button           | yes                                                    | no                   | yes                         | yes                   |
| Calendar               | yes                                                    | no                   | yes, per Event version      | no                    |
| Route                  | `/#/`                                                  | `/#/practice`        | `/#/event`                  | `/#/custom/:code`     |

- Custom URL encoding: `btoa("word_questioner")`, converted to URL-safe Base64 by replacing `+` with `-`, `/` with `_`, and removing `=`.
- Custom puzzle answers can come from `WORDS + VALIDGUESSES`.
- Create Puzzle route: `/#/create`.
- The Create Puzzle page reuses the Keyboard component and keeps cells read-only to suppress the mobile virtual keyboard.
- Questioner names are limited to 10 characters to avoid overlay layout breakage.
- Achievements can target Daily, Practice, Event, Custom, or All modes. Keep each achievement's `mode` scope explicit, and do not broaden existing achievement behavior accidentally.
- Event mode is a reusable seasonal shell. The active Event definition lives in `events.ts`; plug special rules such as Pacman, Hardcore, AI, collectibles, setting overrides, and cosmetic overrides through that context instead of hard-coding them into Daily.
- Event results are keyed by Event version. Keep version-specific records, calendars, custom lose reasons, cosmetic overrides, Event-only Records tabs, and Event Rewards filters scoped through the Event definition so future seasons can reuse the same shell.
- Summer Garden (`v1.7.0`) is the first active Event. It uses `modeKind: 'pacman'`, a rabbit actor, hidden visited cells, grass/garden cosmetic previews, and four-leaf clover collectibles.
- Event collectible logic lives in `eventCollectibles.ts`. Summer Garden clovers are row-based collectibles; wins add the configured win bonus item, and early wins auto-collect remaining eligible rows. Dashboard display should use compact counts such as `🍀5 (+1)` instead of repeating one emoji per item.
- Event guide UI lives in `components/events/` and is shared by Information > Event Mode and Patch Notes Event cards. Season docs for README live under `docs/events/`.

## Event Records And Collectibles

- `src/lib/eventResults.ts` is the canonical per-version Event result store. New Event completions should write through `saveEventResult(event.version, result)`.
- Event game state persistence is separate from Daily and uses the Event version, date, and solution to avoid replaying stale state after a season or answer change.
- `EventResult.guessCount` means actual submitted guesses, matching `DailyResult`.
- Event `endReason` values include default reasons plus Event-defined custom reasons, such as Summer Garden's `pacman` loss.
- Event Records use the selected Event version, not only the active Event. Keep historical Event records readable even after a future Event becomes active.
- Event detail stats are summarized through `getEventDetailStatsHistory()` and shared `playStats.ts` helpers.
- Collectible achievement progress uses `achievementProgress.ts`; store progress by collection id and item id rather than by display text.
- Do not infer missing collectible or tile-count progress from legacy records that did not track the needed data.

## Daily Records And Migration

- `src/lib/dailyResults.ts` is the canonical per-date Daily result store. New Daily completions should write through `saveDailyResult()` there, not directly to `dailyHistory`.
- `gameStats` remains the aggregate source for total games, win distribution, success rate, and streaks because old records can predate Calendar history and cannot be fully reconstructed from per-date data.
- `dailyHistory.ts` is retained for legacy migration and attendance-shaped helper output. Treat its old localStorage data as an input to `dailyResults`, not as the write target for new results.
- `DailyResult.guessCount` means actual submitted guesses. A dead end normally records `guessCount: 5`, while a full guess-limit loss records `guessCount: 6`.
- `DailyResult.endReason` values are:
  - `win`: solved game.
  - `guess_limit`: failed after exhausting guesses.
  - `dead_end`: failed early because the chain letter made the answer impossible.
  - `unknown`: migrated legacy loss where the exact loss reason cannot be recovered.
- Detail stats live on `DailyResult.playStats` and are accessed through the `loadDailyDetailStats*`, `saveDailyDetailStats`, and `summarizeDetailStats` helpers in `playStats.ts`.
- Tile count achievements should use stored `tileCounts` when available. Legacy records without tile counts must not be guessed into retroactive tile-pattern unlocks.

## Rewards Metadata And Sorting

- `src/lib/rewardMetadata.ts` is the shared source for reward release metadata, version labels, filtering, and version sorting. Reuse `compareRewardVersionsDesc`, `sortRewardVersionsDesc`, `matchesRewardMetadata`, and `filterRewardsByMetadata` instead of hand-rolled version comparisons.
- Achievement and cosmetic lists should preserve their declarative order within the same release/version group. Version priority should come from metadata comparison, not array reversal side effects.
- Cosmetics are unlocked by achievement ids through `requiresAchievement`. Keep achievement definitions and cosmetic rewards in sync when adding new rewards.
- Rewards search and filter controls live inside modals. Keyboard events from search inputs, selects, and pickers must not leak into the game board's physical-key handlers.
- Event Rewards opens on Achievements with the active Event version pre-filtered. Users can change the Event filter view, but those Event-specific filter choices should not persist over the global Rewards defaults.

## Profile Backup

- `src/lib/profileTransfer.ts` owns the public backup format for browser-to-browser record/profile transfer.
- Export strings use `WCD1:<base64url(json)>` with `schemaVersion: 1`. Treat this as a compatibility contract once released.
- Keep the technical `WCD1` prefix out of normal user-facing labels and placeholder/error copy. It is an implementation detail, not product wording.
- Use an explicit allowlist. Include records, aggregate stats, achievement state/progress, cosmetic equipment, and settings; do not export raw localStorage.
- Exclude in-progress game state, patch-note seen state, device/browser metadata, and any private implementation-only keys.
- Imports should be conservative: merge Daily/Event records by date, union known achievement unlocks, use max counters for achievement progress, ignore unknown achievement/cosmetic ids, and avoid summing aggregate stats across devices. The Settings UI imports cosmetic equipment and settings by default; reset-to-default actions are separate from import.
- `SettingsModal` presents this as Profile Management with Export and Import subsections. Export copies directly to the clipboard; Import previews automatically as the user pastes.
- Danger Zone actions live at the bottom of Settings. Reset actions provide inline success feedback. Format must require a confirmation modal before clearing localStorage.
- If profile schema changes, add migration/compatibility handling instead of silently changing the meaning of existing `WCD1` payloads.

## Calendar History Policy

- Calendar history markers are user-facing record context, not a developer timeline. Prefer markers that help players understand what happened to the game or why old records may look different.
- Version release markers should be based on actual release dates from `RELEASE_METADATA.releasedAt`, not planning dates, implementation dates, or PR merge dates.
- Version summaries shown from Calendar should be derived from `PATCH_NOTES` feature titles and should link to the matching Information > Patch Notes version. Do not duplicate patch-note summaries inside Calendar-specific data.
- Add extra non-release markers only when a data structure or tracking policy changed enough to affect user interpretation of records, such as Calendar history availability, detail-stat tracking, or a device's first date-based record.
- Data/history marker descriptions should explain the practical consequence for the player, for example that older games can count in Summary but not appear by date on Calendar, or that behavior stats only exist after their tracking rollout.
- Keep release metadata, patch notes, and calendar marker assembly as separate role-based sources of truth: `releaseMetadata.ts` for release dates and themes, `patchNotes.ts` for version content, and `calendarMilestones.ts` for assembling Calendar-visible milestones.

## Temporal And Local Time

The app intentionally uses `Temporal` instead of `Date` for runtime date logic. Daily word selection, subtitles, calendar, share text, and countdown behavior should remain based on `Temporal.Now.plainDateISO()` and local time. Avoid adding new `Date`-based logic for gameplay dates.

## i18n

Translations live in `src/locales/{lang}/translation.json` and are bundled through `src/i18n.ts`. Do not add an HTTP translation backend. Language detection order is localStorage `i18nextLng`, then `CONFIG.defaultLang`. When adding user-facing text, update every supported locale or make a deliberate placeholder decision and call it out.

## UI Notes

- Info, Stats, Rewards, Settings, Donate, and Patch Notes are modal-based.
- `InfoModal` uses mode-specific tab content for `daily`, `practice`, `event`, `custom`, and `create`.
- `PatchNotesModal` is shown when localStorage `seenPatchNotesVersion` differs from `PATCH_NOTES_VERSION`. Because it is a simple mismatch check, downgrades can also show the modal.
- `DonateModal` uses tabs for payment methods including KakaoPay QR, Toss Pay, and GitHub Sponsors. Payment URLs live in `config.ts`.
- `StatsModal` is mode-dependent:
  - Daily: Records tabs are Today, Calendar, Summary, and Details. Today shows the current Daily result, countdown, share controls, and current-day detail stats. Calendar renders monthly `dailyResults`. Summary combines aggregate `gameStats` with per-date loss reasons. Details summarizes tracked `playStats`.
  - Event: Records tabs are Event, Today, Calendar, Summary, and Details. Event records are selected by Event version and use `eventResults` plus the active Event definition for custom panels, lose reasons, share context, and cosmetic overrides.
  - Custom: compact Records view with share and no histogram.
  - localStorage keys: Daily aggregate stats use `gameStats`; Daily date-level records use `dailyResults`; Event records use `eventResults`; Custom uses `customGameStats`.
- `RewardsModal` owns Achievements and Cosmetics. Rewards must remain reachable outside Daily because some achievements and cosmetics can target non-Daily modes.
- Event Rewards opens on Achievements with the active Event version pre-filtered, but users can adjust the filter view without persisting those Event-specific filter choices.
- `SettingsModal` is a single-scroll layout with grouped settings, language selection popup, uppercase/share URL toggles, week-start setting, Enter hint setting, Profile Management, and Danger Zone. Do not put reward selection controls back into Settings unless the product direction changes.
- Settings also owns controller enablement and Profile Management. Profile import/export UI should stay in Settings unless the product direction changes.
- Physical keyboard handlers are game-level. Modal text inputs, search boxes, select/picker popups, profile import fields, and custom puzzle inputs must stop propagation so typing there does not submit letters to the underlying game.

Header icons by mode:

| Icon     | Daily | Practice | Event | Custom | Create |
| -------- | ----- | -------- | ----- | ------ | ------ |
| Info     | yes   | yes      | yes   | yes    | yes    |
| Stats    | yes   | no       | yes   | no     | no     |
| Rewards  | yes   | yes      | yes   | yes    | yes    |
| Settings | yes   | yes      | yes   | yes    | yes    |
| Donate   | yes   | yes      | yes   | yes    | yes    |

Stats is available for Daily and Event. Screenshot scripts rely on icon positions: Daily/Event use Info=0, Stats=1, Rewards=2, Settings=3, Donate=4; other modes use Info=0, Rewards=1, Settings=2, Donate=3.

## Chain Rule

From the second guess onward, each guess is constrained by the previous guess:

```text
Guess 1 -> 2: last letter chains
Guess 2 -> 3: first letter chains
Guess 3 -> 4: last letter chains
Guess 4 -> 5: first letter chains
Guess 5 -> 6: last letter chains
```

Dead end logic matters: if a locked chain letter cannot match the answer at that position, the game can end early. Reuse `src/lib/chain.ts` helpers rather than duplicating chain math.

## Screenshots

README screenshots are generated with Playwright:

```bash
npm run readme:screenshots
```

- The script is `scripts/generate-readme-screenshots.spec.ts`.
- Config is `scripts/readme-screenshots.config.ts`.
- The config sets the web server `cwd` to the repository root and builds with `PUBLIC_URL=/`; keep both or localhost screenshots can serve the wrong path and return 404.
- It uses a mobile-optimized Chromium viewport, currently 526x750 at 2x scale.
- Output goes to `assets/`.
- It reuses helpers from `e2e/fixtures/game.fixture.ts`.
- The main screenshot date is fixed to 2026-02-20 so Daily word `hydro` is available naturally. `WORDS[4]` is `hydro`; epoch 2026-02-16 plus 4 days is 2026-02-20.
- Calendar screenshots use 2026-03-12 separately to provide richer history data.
- Event screenshots use the active Event route. Event mode auto-opens the Information modal on first visit, so screenshot scripts must explicitly wait for and close it before capturing the bare Event board, or wait for it fully before capturing the Event guide.
- Do not regenerate screenshots unless the task needs visual docs updates.

## Documentation

- `README.md` is player-facing. Keep it organized around player concepts: How to Play, Game Modes, Records, Rewards, Profile and Settings, Updates, Support, Development, and Credits.
- Do not turn README into a changelog. Put release-specific summaries in `patchNotes.ts` and release PR bodies; put reusable season rules in `docs/events/`.
- Season-specific Event docs live in `docs/events/{season}.md` and should be linked from README. Keep these docs player-oriented and aligned with the in-app Event guide.
- README screenshots live in `assets/` and are generated by `npm run readme:screenshots`. If README references a new screenshot, add it to `scripts/generate-readme-screenshots.spec.ts` and visually verify the generated PNG.

## Agent Workflow Notes

- Read this file before implementing non-trivial changes.
- Repository-scoped agent skills live in `.agents/skills/`. Use them for version bumps, PR creation, and post-merge cleanup.
- Keep edits scoped to the issue or user request.
- Do not revert user changes or unrelated dirty worktree changes.
- Prefer existing helpers and local patterns over new abstractions.
- For code edits, add tests when behavior, storage contracts, achievements, sharing, or cross-mode logic changes.
- For frontend changes, check the app visually when practical. The local dev command is `PUBLIC_URL=/ npm start`.
- For GitHub writes, prefer the connected GitHub tooling where it works; use `gh` with `--repo Ootzk/Wor-chain-dle` when local branch state, auth, or CLI-only features matter.

## Tool-Specific Files

- `AGENTS.md`: canonical, tool-neutral guide.
- `CLAUDE.md`: Claude Code compatibility wrapper that imports `AGENTS.md`.
- `.agents/skills/`: repository-scoped agent skills. Keep reusable agent workflow details here.
- `.claude/skills/`: Claude Code slash-command entrypoints. Keep them as wrappers around `.agents/skills/`.
- If a workflow becomes useful to multiple agents, document it as a repository skill in `.agents/skills/` and keep tool-specific files as thin wrappers.

## Version History

- `v0.x`: fork setup, English Wordle baseline, QWERTY keyboard.
- `v1.0.x`: snake chain rule, ChainBridge visualization, dead ends, box-drawing share format, GitHub Pages, GoatCounter.
- `v1.1.0`: Practice mode, uppercase setting, 6-language i18n, donation modal, patch notes popup, README overhaul.
- `v1.2.0`: Custom puzzle creation/sharing, Playwright E2E infrastructure, mode-specific InfoModal tabs, payment tabs, README screenshot automation, E2E in CI.
- `v1.3.0`: monthly calendar with Daily history visualization, month navigation, emoji calendar sharing, Sunday/Monday week-start setting, share URL exclusion setting, Daily ISO share dates, share URL hash cleanup, Settings section removal, bundled translation resources, CI E2E restoration, calendar/share tests.
- `v1.4.0`: local-timezone daily reset with Temporal, Calendar moved into Stats, language moved into Settings dropdown, header icons reduced from 6 to 4, modal title icons, GitHub Sponsors tab, dailyHistory migration from integer keys to date strings, screenshot clock control, local-timezone E2E tests.
- `v1.5.0`: Achievements and Cosmetics systems with 12 achievements and 12 plus 6 default cosmetics, declarative achievement definitions, progress unlocks, retro unlocks, gold achievement toast, `NEW!` tags, Share Emoji options, cell font/color cosmetics, chain style/color cosmetics, alert message themes, Settings sample view and custom picker popup, locked cosmetics jump to achievements, alert color improvements, week-start setting removal, German locale, Headless UI upgrade, Calendar Share button layout, dynamic README release badge.
- `v1.6.0`: Rewards modal consolidation for Achievements and Cosmetics, reward release metadata, filtering/sorting, expanded achievement and cosmetic content, Daily Records detail stats, Summary/Details records updates, profile export/import, profile reset confirmations, calendar release/data milestones, and README screenshot refreshes.
- `v1.7.0`: Event mode infrastructure, Summer Garden seasonal Event with rabbit path and clover collectibles, Event Records and Event Calendar, Event Rewards and cosmetic previews, behavior stats in Records, Rewards input keyboard isolation, reward ordering fixes, v1.7.0 patch notes, README Event docs, and release-date metadata for June 1, 2026.

## Communication

- Communicate with the developer in Korean.
- Summaries should be concise and focused on what changed, how it was verified, and what remains.

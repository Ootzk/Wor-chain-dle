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
  index.tsx                       HashRouter routes (/, /practice, /create, /custom/:code)
  App.tsx                         main game flow and input handlers
  i18n.ts                         i18next setup with bundled locale resources
  locales/{lang}/translation.json translations
  constants/
    config.ts                     game config, payment URLs, PATCH_NOTES_VERSION
    orthography.ts                valid character system
    wordlist.ts                   shuffled answer words, currently 2,315 entries
    validGuesses.ts               allowed guess words, currently 10,656 entries
  lib/
    words.ts                      daily word selection and word validation
    statuses.ts                   correct/present/absent status calculation
    chain.ts                      chain-rule and dead-end helpers
    share.ts                      share text generation
    dailyHistory.ts               Daily-only result history in localStorage
    customPuzzle.ts               Custom puzzle URL-safe Base64 codec
    tokenizer.ts                  orthography-aware tokenization
    achievements.ts               achievement definitions and unlock engine
    cosmetics.ts                  cosmetic definitions, options, and equipment
  components/
    grid/                         game grid and chain bridge UI
    keyboard/                     QWERTY keyboard and physical-key handling
    calendar/                     monthly Daily history UI
    achievements/                 achievement list and progress UI
    cosmetics/                    shared cosmetic previews
    modals/                       Info, Stats, Settings, Donate, Patch Notes
    pages/                        Create Puzzle page
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
- `share-exclude-url.spec.ts`: URL exclusion from share text.
- `navigation.spec.ts`: route transitions and page navigation.
- `local-timezone.spec.ts`: local-timezone daily reset and dailyHistory migration.

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
- Always pass `--repo Ootzk/Wor-chain-dle` to `gh pr create` and other GitHub CLI commands that can infer a repository. This repo has an upstream fork remote, so implicit repo detection can target the wrong repository.

Required PR metadata:

- Labels matching the change type. Available labels include:
  - `✨ enhancement`: new feature.
  - `🐛 bug`: bug fix.
  - `📝 documentation`: documentation.
  - `🎨 UI/UX`: design or UI improvement.
  - `💰 donation`: donation-related change.
  - `🔖 versioning`: release-to-main PRs.
  - `🧑‍💻 devops`: development environment, CI, or testing.
  - `💥 breaking change`: incompatible behavior.
  - `🌐 i18n`: translations or locale behavior.
  - `browser: chrome`, `browser: safari`: browser-specific change.
  - `platform: PC`, `platform: mobile`: platform-specific change.
- Assignee: `Ootzk`.
- Milestone: target release version such as `v1.6.0`. Create the milestone first if it does not exist.
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

## Game Modes

| Item                   | Daily                         | Practice                    | Custom                |
| ---------------------- | ----------------------------- | --------------------------- | --------------------- |
| Answer source          | `WORDS`, local midnight reset | random `WORDS` entry        | creator-selected word |
| Stats                  | `gameStats`                   | none currently              | `customGameStats`     |
| Daily history          | yes                           | no                          | no                    |
| Game state persistence | yes                           | no                          | no                    |
| Share button           | yes                           | no                          | yes                   |
| Calendar               | yes                           | no                          | no                    |
| Route                  | `/#/`                         | `/#/` after Practice action | `/#/custom/:code`     |

- Custom URL encoding: `btoa("word_questioner")`, converted to URL-safe Base64 by replacing `+` with `-`, `/` with `_`, and removing `=`.
- Custom puzzle answers can come from `WORDS + VALIDGUESSES`.
- Create Puzzle route: `/#/create`.
- The Create Puzzle page reuses the Keyboard component and keeps cells read-only to suppress the mobile virtual keyboard.
- Questioner names are limited to 10 characters to avoid overlay layout breakage.
- Current achievements are Daily-only unless a task explicitly broadens mode support. When adding Practice or Custom achievements, keep existing Daily achievement behavior intact and add mode support deliberately.

## Temporal And Local Time

The app intentionally uses `Temporal` instead of `Date` for runtime date logic. Daily word selection, subtitles, calendar, share text, and countdown behavior should remain based on `Temporal.Now.plainDateISO()` and local time. Avoid adding new `Date`-based logic for gameplay dates.

## i18n

Translations live in `src/locales/{lang}/translation.json` and are bundled through `src/i18n.ts`. Do not add an HTTP translation backend. Language detection order is localStorage `i18nextLng`, then `CONFIG.defaultLang`. When adding user-facing text, update every supported locale or make a deliberate placeholder decision and call it out.

## UI Notes

- Info, Stats, Settings, Donate, and Patch Notes are modal-based.
- `InfoModal` uses mode-specific tab content for `daily`, `practice`, `custom`, and `create`.
- `PatchNotesModal` is shown when localStorage `seenPatchNotesVersion` differs from `PATCH_NOTES_VERSION`. Because it is a simple mismatch check, downgrades can also show the modal.
- `DonateModal` uses tabs for payment methods including KakaoPay QR, Toss Pay, and GitHub Sponsors. Payment URLs live in `config.ts`.
- `StatsModal` is mode-dependent:
  - Daily: tab UI with Statistics, Calendar, and Achievements. Statistics includes summary stats and Guess Distribution. Completed games show Share and countdown. Calendar contains monthly Daily history. Achievements contains progress, rewards, and `NEW!` state.
  - Custom: compact Records view with share and no histogram.
  - localStorage keys: Daily uses `gameStats`, Custom uses `customGameStats`.
- `SettingsModal` is a single-scroll layout with language selection popup, sample view, uppercase/share URL toggles, cosmetic dropdown pickers, and Alert Message theme picker. Alert Message uses a left/right transition-only popup.

Header icons by mode:

| Icon     | Daily | Practice | Custom | Create |
| -------- | ----- | -------- | ------ | ------ |
| Info     | yes   | yes      | yes    | yes    |
| Stats    | yes   | no       | no     | no     |
| Settings | yes   | yes      | yes    | yes    |
| Donate   | yes   | yes      | yes    | yes    |

Stats is Daily-only. Screenshot scripts rely on icon positions: Daily uses Info=0, Stats=1, Settings=2, Donate=3; other modes use Info=0, Settings=1, Donate=2.

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
GENERATE_SCREENSHOTS=1 npm run readme:screenshots
```

- The script is `scripts/generate-readme-screenshots.spec.ts`.
- Config is `scripts/readme-screenshots.config.ts`.
- It uses a mobile-optimized Chromium viewport, currently 526x750 at 2x scale.
- Output goes to `assets/`.
- It reuses helpers from `e2e/fixtures/game.fixture.ts`.
- The main screenshot date is fixed to 2026-02-20 so Daily word `hydro` is available naturally. `WORDS[4]` is `hydro`; epoch 2026-02-16 plus 4 days is 2026-02-20.
- Calendar screenshots use 2026-03-12 separately to provide richer history data.
- Do not regenerate screenshots unless the task needs visual docs updates.

## Agent Workflow Notes

- Read this file before implementing non-trivial changes.
- Shared workflow docs live in `docs/agent-workflows/`. Use them for version bumps, PR creation, and post-merge cleanup.
- Keep edits scoped to the issue or user request.
- Do not revert user changes or unrelated dirty worktree changes.
- Prefer existing helpers and local patterns over new abstractions.
- For code edits, add tests when behavior, storage contracts, achievements, sharing, or cross-mode logic changes.
- For frontend changes, check the app visually when practical. The local dev command is `PUBLIC_URL=/ npm start`.
- For GitHub writes, prefer the connected GitHub tooling where it works; use `gh` with `--repo Ootzk/Wor-chain-dle` when local branch state, auth, or CLI-only features matter.

## Tool-Specific Files

- `AGENTS.md`: canonical, tool-neutral guide.
- `CLAUDE.md`: Claude Code compatibility wrapper that imports `AGENTS.md`.
- `docs/agent-workflows/`: shared workflow docs for agents and humans.
- `.claude/skills/`: Claude Code slash-command entrypoints. Keep them as wrappers around shared workflows.
- If a workflow becomes useful to multiple agents, document it in `docs/agent-workflows/` and keep tool-specific files as thin wrappers.

## Version History

- `v0.x`: fork setup, English Wordle baseline, QWERTY keyboard.
- `v1.0.x`: snake chain rule, ChainBridge visualization, dead ends, box-drawing share format, GitHub Pages, GoatCounter.
- `v1.1.0`: Practice mode, uppercase setting, 6-language i18n, donation modal, patch notes popup, README overhaul.
- `v1.2.0`: Custom puzzle creation/sharing, Playwright E2E infrastructure, mode-specific InfoModal tabs, payment tabs, README screenshot automation, E2E in CI.
- `v1.3.0`: monthly calendar with Daily history visualization, month navigation, emoji calendar sharing, Sunday/Monday week-start setting, share URL exclusion setting, Daily ISO share dates, share URL hash cleanup, Settings section removal, bundled translation resources, CI E2E restoration, calendar/share tests.
- `v1.4.0`: local-timezone daily reset with Temporal, Calendar moved into Stats, language moved into Settings dropdown, header icons reduced from 6 to 4, modal title icons, GitHub Sponsors tab, dailyHistory migration from integer keys to date strings, screenshot clock control, local-timezone E2E tests.
- `v1.5.0`: Achievements and Cosmetics systems with 12 achievements and 12 plus 6 default cosmetics, declarative achievement definitions, progress unlocks, retro unlocks, gold achievement toast, `NEW!` tags, Share Emoji options, cell font/color cosmetics, chain style/color cosmetics, alert message themes, Settings sample view and custom picker popup, locked cosmetics jump to achievements, alert color improvements, week-start setting removal, German locale, Headless UI upgrade, Calendar Share button layout, dynamic README release badge.

## Communication

- Communicate with the developer in Korean.
- Summaries should be concise and focused on what changed, how it was verified, and what remains.

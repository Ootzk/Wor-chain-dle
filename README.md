# Wor-chain-dle

[![Release](https://img.shields.io/github/v/release/Ootzk/Wor-chain-dle?label=release&logo=github)](https://github.com/Ootzk/Wor-chain-dle/releases)

**Wordle meets word chain** — guess the word while chaining letters in a snake pattern.

A new word every day at [ootzk.github.io/Wor-chain-dle](https://ootzk.github.io/Wor-chain-dle).

<p align="center">
  <img src="assets/empty-board.png" alt="Wor-chain-dle game board" width="300" />
</p>

---

## How to Play

Guess the hidden 5-letter word in 6 tries. After each guess, tiles change color to show how close you were:

- **Green** — Correct letter, correct spot.
- **Purple** — Correct letter, wrong spot.
- **Gray** — Letter not in the word.

<p align="center">
  <img src="assets/how-to-play.png" alt="How to Play modal" width="300" />
</p>

## The Chain Rule

Here's the twist. Starting from your **2nd guess**, a letter **chains** from your previous word. The chained letter is auto-filled and locked — you can't change it.

Your first guess is free. Let's say you start with **SHAKE**:

<p align="center">
  <img src="assets/first-guess.png" alt="First guess: SHAKE" width="300" />
</p>

The last letter **E** chains down to your second guess. It's already locked in — your next word must end with that letter. You enter **LANCE**:

<p align="center">
  <img src="assets/second-guess.png" alt="Second guess: LANCE chains from E" width="300" />
</p>

The chain alternates sides like a snake:

```
Guess 1 → 2:  last letter chains   (right side)
Guess 2 → 3:  first letter chains  (left side)
Guess 3 → 4:  last letter chains   (right side)
Guess 4 → 5:  first letter chains  (left side)
Guess 5 → 6:  last letter chains   (right side)
```

## Dead Ends

&#x26A0;&#xFE0F; Watch out — if the chained letter doesn't match the answer's position, the game ends early. Plan your guesses carefully!

<p align="center">
  <img src="assets/dead-end.png" alt="Dead end: chain letter mismatch" width="300" />
</p>

## Victory

Solve the chain and you'll be rewarded:

<p align="center">
  <img src="assets/success.png" alt="Victory!" width="300" />
</p>

Track your stats and share your results with friends:

<p align="center">
  <img src="assets/statistics.png" alt="Statistics and Share" width="300" />
</p>

<pre>
Wor🔗dle 2026-02-20 6/6

─⬜🟪⬜⬜⬜┐
┌⬜⬜⬜⬜⬜┘
└⬜🟪🟪⬜⬜┐
┌⬜⬜⬜⬜⬜┘
└⬜⬜🟪⬜🟩┐
─🟩🟩🟩🟩🟩┘

ootzk.github.io/Wor-chain-dle
</pre>

---

## Features

New features are introduced through a one-time "What's New" popup on your first visit after an update.

<p align="center">
  <img src="assets/patch-note.png" alt="What's New in v1.4.0" width="300" />
</p>

### Create & Share Custom Puzzles

Create your own puzzle and challenge your friends! Tap "Create" at the bottom, enter your name and a 5-letter word, then press Enter to copy a shareable link.

<p align="center">
  <img src="assets/create-puzzle.png" alt="Create Puzzle — URL copied" width="300" />
</p>

Your friend opens the link and plays your custom puzzle with the full chain rule:

<p align="center">
  <img src="assets/custom-puzzle.png" alt="Playing a custom puzzle" width="300" />
</p>

### Practice Mode

Done with today's word? Tap "Practice" at the bottom to play unlimited games with random words — no waiting until tomorrow.

<p align="center">
  <img src="assets/practice-mode.png" alt="Practice Mode" width="300" />
</p>

### Multi-Language Support

Available in 6 languages. Change the language from the dropdown in Settings.

<p align="center">
  <img src="assets/settings-kor.png" alt="Language selection in Settings" width="300" />
  &nbsp;&nbsp;
  <img src="assets/how-to-play-kor.png" alt="How to Play in Korean" width="300" />
</p>

### Monthly Calendar

Track your daily results on a monthly calendar. Open the Stats modal and switch to the Calendar tab (Daily mode only) to see your history at a glance — green cells for wins, purple for losses. Navigate between months, check your current streak, and share your monthly results as an emoji grid.

<p align="center">
  <img src="assets/calendar.png" alt="Monthly Calendar" width="300" />
</p>

<pre>
Wor🔗dle 2026-03 (🔥 1)

Su Mo Tu We Th Fr Sa
🟩 🟩 🟩 🟩 🟪 🟩 🟩
🟩 🟩 🟪 🟩 ⬜ ⚪ ⚪
⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪
⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪
⚪ ⚪ ⚪

ootzk.github.io/Wor-chain-dle
</pre>

### Settings

Customize your experience:

- **Uppercase Letters** — Display letters in uppercase.
- **Start Week on Monday** — Change the calendar's week start day.
- **Exclude URL when Sharing** — Omit the game URL from share text.
- **Language** — Switch between 6 languages from the dropdown.

<p align="center">
  <img src="assets/settings.png" alt="Settings" width="300" />
</p>

### Support the Developer

If you enjoy the game, consider buying the developer a drink!

<p align="center">
  <img src="assets/donation.png" alt="Donate" width="300" />
</p>

---

## Development

```bash
npm install
npm start          # dev server (http://localhost:3000)
npm run build      # production build
npm test           # run tests
```

## Credits

- Based on [AnyLanguage-Word-Guessing-Game](https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game)
- Word list from the [original Wordle](https://www.nytimes.com/games/wordle)
- Analytics by [GoatCounter](https://www.goatcounter.com)

# Wor-chain-dle

![Version](https://img.shields.io/badge/Version-v0.3.0-blue)

Wordle meets word chain — guess the word while chaining letters in a snake pattern.

## How to Play

1. Guess the hidden 5-letter word in 6 tries.
2. After each guess, the color of the tiles will change to show how close your guess was to the word.
   - **Green** — The letter is in the correct spot.
   - **Purple** — The letter is in the word but in the wrong spot.
   - **Gray** — The letter is not in the word.
3. **Snake chain rule:** Starting from the 2nd guess, your word must chain with the previous guess. The chain alternates sides like a snake:

```text
OOOOX        guess 1: free
AOOOX  -->   guess 2: last letter must match guess 1's last letter
AOOOB  <--   guess 3: first letter must match guess 2's first letter
YOOOB  -->   guess 4: last letter must match guess 3's last letter
YOOOT  <--   guess 5: first letter must match guess 4's first letter
OOOOT  -->   guess 6: last letter must match guess 5's last letter
```

1. A new word is available every day.

import { Temporal } from 'temporal-polyfill'
import { WORDS } from '../constants/wordlist'
import { VALIDGUESSES } from '../constants/validGuesses'
import { CONFIG } from '../constants/config'

export const isWordInWordList = (word: string) => {
  return WORDS.includes(word) || VALIDGUESSES.includes(word)
}

export const isWinningWord = (word: string, sol: string) => {
  return sol === word
}

export const getRandomWord = () => {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export const getWordOfDay = () => {
  const epoch = Temporal.PlainDate.from(CONFIG.startDate)
  const today = Temporal.Now.plainDateISO()
  const index = today.since(epoch).days

  const tz = Temporal.Now.timeZoneId()
  const tomorrow = today
    .add({ days: 1 })
    .toZonedDateTime(tz).epochMilliseconds

  return {
    solution: WORDS[index % WORDS.length],
    solutionIndex: index,
    tomorrow,
  }
}

export const { solution, solutionIndex, tomorrow } = getWordOfDay()

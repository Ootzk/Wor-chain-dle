import { getGuessStatuses } from './statuses'
import { CONFIG } from '../constants/config'

export const shareCustomStatus = (
  guesses: string[][],
  lost: boolean,
  solution: string,
  questioner: string
) => {
  const shareText =
    `Wor\u{1F517}dle Custom/${questioner}` +
    ' ' +
    `${lost ? 'X' : guesses.length}` +
    '/' +
    CONFIG.tries.toString() +
    '\n\n' +
    generateEmojiGrid(guesses, solution) +
    '\n\n' +
    window.location.href.replace(`${window.location.protocol}//`, '')

  navigator.clipboard.writeText(shareText)
}

export const shareStatus = (
  guesses: string[][],
  lost: boolean,
  solution: string
) => {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')

  const shareText =
    `Wor\u{1F517}dle ${yyyy}/${mm}/${dd}` +
    ' ' +
    `${lost ? 'X' : guesses.length}` +
    '/' +
    CONFIG.tries.toString() +
    '\n\n' +
    generateEmojiGrid(guesses, solution) +
    '\n\n' +
    window.location.href.replace(`${window.location.protocol}//`, '')

  navigator.clipboard.writeText(shareText)
}

export const generateEmojiGrid = (
  guesses: string[][],
  solution: string
) => {
  return guesses
    .map((guess, gi) => {
      const status = getGuessStatuses(guess, solution)
      const row = guess
        .map((_, i) => {
          switch (status[i]) {
            case 'correct':
              return '🟩'
            case 'present':
              return '🟪'
            default:
              return '⬜'
          }
        })
        .join('')

      const isLast = gi === guesses.length - 1
      const exitsRight = !isLast && gi % 2 === 0
      const exitsLeft = !isLast && gi % 2 === 1
      const entersRight = gi > 0 && gi % 2 === 1
      const entersLeft = gi > 0 && gi % 2 === 0

      const left = entersLeft ? '└' : exitsLeft ? '┌' : '─'
      const right = entersRight ? '┘' : exitsRight ? '┐' : '─'

      return left + row + right
    })
    .join('\n')
}

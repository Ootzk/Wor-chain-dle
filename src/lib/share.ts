import { getGuessStatuses } from './statuses'
import { CONFIG } from '../constants/config'
import { DailyHistory, dateToSolutionIndex, getDailyHistoryStartIndex } from './dailyHistory'

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

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const shareCalendar = (
  year: number,
  month: number, // 0-indexed
  dailyHistory: DailyHistory,
  streak: number
) => {
  const mm = String(month + 1).padStart(2, '0')
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay()

  const now = new Date()
  const todayYear = now.getUTCFullYear()
  const todayMonth = now.getUTCMonth()
  const todayDate = now.getUTCDate()

  const epochDate = new Date(CONFIG.startDate)
  const epochIndex = dateToSolutionIndex(epochDate)
  const historyStartIndex = getDailyHistoryStartIndex()

  const isCurrentMonth = year === todayYear && month === todayMonth
  const lines: string[] = []
  const header = isCurrentMonth
    ? `\u{1F4C5} Wor\u{1F517}dle ${year}/${mm} (\u{1F525} ${streak})`
    : `\u{1F4C5} Wor\u{1F517}dle ${year}/${mm}`
  lines.push(header)
  lines.push('')
  lines.push(WEEKDAY_LABELS.join(' '))

  // Build grid rows
  let row: string[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, month, d))
    const index = dateToSolutionIndex(date)
    const isFuture =
      year > todayYear ||
      (year === todayYear && month > todayMonth) ||
      (year === todayYear && month === todayMonth && d > todayDate)
    const isBeforeEpoch = index < epochIndex

    if (isFuture || isBeforeEpoch) {
      row.push('⚪') // invalid date (future / before epoch)
    } else {
      const result = dailyHistory[index]
      const isPreRecording =
        historyStartIndex !== null && index < historyStartIndex
      if (!result) {
        row.push(isPreRecording ? '⬛' : '⬜') // pre-recording / not played
      } else if (result.won) {
        row.push('🟩') // won
      } else {
        row.push('🟪') // lost
      }
    }

    if (row.length === 7) {
      lines.push(row.join(' '))
      row = []
    }
  }

  // Flush remaining days (no trailing padding)
  if (row.length > 0) {
    lines.push(row.join(' '))
  }

  lines.push('')
  lines.push(
    window.location.href
      .replace(`${window.location.protocol}//`, '')
      .replace(/#.*$/, '')
  )

  navigator.clipboard.writeText(lines.join('\n'))
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

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

const WEEKDAY_LABELS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAY_LABELS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export const shareCalendar = (
  year: number,
  month: number, // 0-indexed
  dailyHistory: DailyHistory,
  streak: number,
  weekStartsOnMonday: boolean = false
) => {
  const mm = String(month + 1).padStart(2, '0')
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

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
  lines.push((weekStartsOnMonday ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN).join(' '))

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

    const isPreCalendarEpoch =
      historyStartIndex !== null && index < historyStartIndex

    if (isFuture || isBeforeEpoch || isPreCalendarEpoch) {
      row.push('⚪') // inactive (future / before epoch / pre-calendar)
    } else {
      const result = dailyHistory[index]
      if (!result) {
        row.push('⬜') // not played
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

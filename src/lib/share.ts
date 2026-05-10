import { Temporal } from 'temporal-polyfill'
import { getGuessStatuses } from './statuses'
import { CONFIG } from '../constants/config'
import {
  DailyHistory,
  dateToKey,
  getDailyHistoryStartDate,
} from './dailyHistory'
import { getEquippedShareBadge, getEquippedShareEmoji } from './cosmetics'

const formatShareTitle = (suffix?: string): string => {
  const badge = getEquippedShareBadge()
  return [`Wor${badge}dle`, suffix].filter(Boolean).join(' ')
}

const formatShareHeader = (suffix: string, result: string): string => {
  return [formatShareTitle(suffix), result].filter(Boolean).join(' ')
}

export const shareCustomStatus = (
  guesses: string[][],
  lost: boolean,
  solution: string,
  questioner: string,
  excludeUrl: boolean = false
) => {
  const shareText =
    formatShareHeader(
      `Custom/${questioner}`,
      `${lost ? 'X' : guesses.length}/${CONFIG.tries.toString()}`
    ) +
    '\n\n' +
    generateEmojiGrid(guesses, solution) +
    (excludeUrl
      ? ''
      : '\n\n' +
        window.location.href.replace(`${window.location.protocol}//`, ''))

  navigator.clipboard.writeText(shareText)
}

export const generateShareText = (
  guesses: string[][],
  lost: boolean,
  solution: string,
  tries: number,
  dateLabel: string,
  excludeUrl: boolean = false,
  urlOverride?: string
): string => {
  return (
    formatShareHeader(
      dateLabel,
      `${lost ? 'X' : guesses.length}/${tries.toString()}`
    ) +
    '\n\n' +
    generateEmojiGrid(guesses, solution) +
    (excludeUrl
      ? ''
      : '\n\n' +
        (urlOverride ??
          window.location.href
            .replace(`${window.location.protocol}//`, '')
            .replace(/#.*$/, '')))
  )
}

export const shareStatus = (
  guesses: string[][],
  lost: boolean,
  solution: string,
  excludeUrl: boolean = false
) => {
  const today = Temporal.Now.plainDateISO()
  const shareText = generateShareText(
    guesses,
    lost,
    solution,
    CONFIG.tries,
    today.toString(),
    excludeUrl
  )
  navigator.clipboard.writeText(shareText)
}

const WEEKDAY_LABELS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAY_LABELS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export const shareCalendar = (
  year: number,
  month: number, // 0-indexed
  dailyHistory: DailyHistory,
  streak: number,
  weekStartsOnMonday: boolean = false,
  excludeUrl: boolean = false
) => {
  const mm = String(month + 1).padStart(2, '0')
  const epoch = Temporal.PlainDate.from(CONFIG.startDate)
  const today = Temporal.Now.plainDateISO()
  const startDate = getDailyHistoryStartDate()

  const firstDay = Temporal.PlainDate.from({
    year,
    month: month + 1,
    day: 1,
  })
  const daysInMonth = firstDay.daysInMonth

  const isCurrentMonth = year === today.year && month === today.month - 1

  const lines: string[] = []
  const header = formatShareTitle(
    isCurrentMonth ? `${year}-${mm} (\u{1F525} ${streak})` : `${year}-${mm}`
  )
  lines.push(header)
  lines.push('')
  lines.push(
    (weekStartsOnMonday ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN).join(' ')
  )

  // Build grid rows
  let row: string[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = firstDay.with({ day: d })
    const key = dateToKey(date)
    const isFuture = Temporal.PlainDate.compare(date, today) > 0
    const isBeforeEpoch = Temporal.PlainDate.compare(date, epoch) < 0
    const isPreCalendarEpoch = startDate !== null && key < startDate

    const emoji = getEquippedShareEmoji()
    if (isFuture || isBeforeEpoch || isPreCalendarEpoch) {
      row.push('\u26AA') // inactive (future / before epoch / pre-calendar)
    } else {
      const result = dailyHistory[key]
      if (!result) {
        row.push(emoji.absent) // not played
      } else if (result.won) {
        row.push(emoji.correct) // won
      } else {
        row.push(emoji.present) // lost
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

  if (!excludeUrl) {
    lines.push('')
    lines.push(
      window.location.href
        .replace(`${window.location.protocol}//`, '')
        .replace(/#.*$/, '')
    )
  }

  navigator.clipboard.writeText(lines.join('\n'))
}

export const generateEmojiGrid = (guesses: string[][], solution: string) => {
  const emoji = getEquippedShareEmoji()
  return guesses
    .map((guess, gi) => {
      const status = getGuessStatuses(guess, solution)
      const row = guess
        .map((_, i) => {
          switch (status[i]) {
            case 'correct':
              return emoji.correct
            case 'present':
              return emoji.present
            default:
              return emoji.absent
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

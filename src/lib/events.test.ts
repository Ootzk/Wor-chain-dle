import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'
import { WORDS } from '../constants/wordlist'
import { getActiveEvent, getEventWordOfDay } from './events'

test('selects deterministic event words from an event seed', () => {
  const event = getActiveEvent()
  const date = Temporal.PlainDate.from('2026-05-20')

  expect(getEventWordOfDay(event, date)).toEqual(getEventWordOfDay(event, date))
})

test('uses a different answer seed from Daily', () => {
  const event = getActiveEvent()
  const date = Temporal.PlainDate.from('2026-05-20')
  const eventWord = getEventWordOfDay(event, date)
  const dailyIndex = date.since(Temporal.PlainDate.from(CONFIG.startDate)).days

  expect(eventWord.solutionIndex).not.toEqual(dailyIndex % WORDS.length)
})

import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../constants/config'
import { WORDS } from '../constants/wordlist'
import { resolveCosmeticOverrides } from './cosmetics'
import {
  getActiveEvent,
  getEventWordOfDay,
  getEventWordPermutation,
} from './events'

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

test('uses a seeded random word permutation for event answers', () => {
  const permutation = getEventWordPermutation('v1.7.0-event')
  const otherPermutation = getEventWordPermutation('different-event')

  expect(permutation).toHaveLength(WORDS.length)
  expect(new Set(permutation).size).toBe(WORDS.length)
  expect(permutation).toEqual(getEventWordPermutation('v1.7.0-event'))
  expect(permutation.slice(0, 20)).not.toEqual(otherPermutation.slice(0, 20))
})

test('defines cosmetic overrides for the active event theme', () => {
  const event = getActiveEvent()

  expect(event.modeKind).toBe('pacman')
  expect(event.pacman).toMatchObject({
    actor: '🐇',
    effect: 'hide-letter-and-status',
  })
  expect(event.collectibles).toEqual([
    expect.objectContaining({
      id: 'clover',
      emoji: '🍀',
      targetRows: [1, 2, 3, 4],
    }),
  ])
  expect(event.cosmeticOverrides).toMatchObject({
    shareEmoji: 'emoji_garden',
    shareBadge: [
      'badge_apple',
      'badge_grape',
      'badge_milk',
      'badge_azure',
      'badge_clover',
      'badge_hyacinth',
      'badge_rabbit',
    ],
    cellColor: 'color_azure',
    chainColor: 'chaincolor_azure',
  })
  expect(event.shareContextLabel).toBe('Event: Summer Garden')
})

test('resolves random event cosmetic candidates without mutating the config', () => {
  const event = getActiveEvent()
  const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5)

  const resolved = resolveCosmeticOverrides(event.cosmeticOverrides)

  expect(resolved).toMatchObject({
    shareEmoji: 'emoji_garden',
    shareBadge: 'badge_azure',
    cellColor: 'color_azure',
    chainColor: 'chaincolor_azure',
  })
  expect(event.cosmeticOverrides?.shareBadge).toEqual([
    'badge_apple',
    'badge_grape',
    'badge_milk',
    'badge_azure',
    'badge_clover',
    'badge_hyacinth',
    'badge_rabbit',
  ])

  randomSpy.mockRestore()
})

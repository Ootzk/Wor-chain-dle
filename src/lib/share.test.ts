import { generateShareText, shareCalendar } from './share'

const guesses = [['c', 'h', 'a', 'i', 'n']]

describe('share header badge', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    })
  })

  it('uses chain as the default title badge', () => {
    const text = generateShareText(
      guesses,
      false,
      'chain',
      6,
      '2026-05-09',
      true
    )

    expect(text.split('\n')[0]).toBe('Wor\uD83D\uDD17dle 2026-05-09 1/6')
  })

  it('replaces the title badge when a share badge is equipped', () => {
    localStorage.setItem(
      'cosmeticState',
      JSON.stringify({
        equipped: {
          shareBadge: 'badge_fire',
        },
      })
    )

    const text = generateShareText(
      guesses,
      false,
      'chain',
      6,
      '2026-05-09',
      true
    )

    expect(text.split('\n')[0]).toBe('Wor\uD83D\uDD25dle 2026-05-09 1/6')
  })

  it('maps the legacy none badge to the chain title badge', () => {
    localStorage.setItem(
      'cosmeticState',
      JSON.stringify({
        equipped: {
          shareBadge: 'badge_none',
        },
      })
    )

    const text = generateShareText(
      guesses,
      false,
      'chain',
      6,
      '2026-05-09',
      true
    )

    expect(text.split('\n')[0]).toBe('Wor\uD83D\uDD17dle 2026-05-09 1/6')
  })

  it('uses a cosmetic override without changing saved equipment', () => {
    localStorage.setItem(
      'cosmeticState',
      JSON.stringify({
        equipped: {
          shareBadge: 'badge_fire',
        },
      })
    )

    const text = generateShareText(
      guesses,
      false,
      'chain',
      6,
      '2026-05-09',
      true,
      undefined,
      { shareBadge: 'badge_azure' }
    )

    expect(text.split('\n')[0]).toBe('Wor\uD83D\uDC9Adle 2026-05-09 1/6')
    expect(localStorage.getItem('cosmeticState')).toContain('badge_fire')
  })

  it('adds an event context label before the date', () => {
    const text = generateShareText(
      guesses,
      false,
      'chain',
      6,
      '2026-05-09',
      true,
      undefined,
      { shareBadge: 'badge_azure' },
      'Event: Summer Garden'
    )

    expect(text.split('\n').slice(0, 2)).toEqual([
      'Wor\uD83D\uDC9Adle 2026-05-09 1/6',
      'Event: Summer Garden',
    ])
  })

  it('adds an event context label to calendar share text', () => {
    shareCalendar(
      2026,
      0,
      {},
      0,
      false,
      true,
      null,
      { shareBadge: 'badge_azure' },
      'Event: Summer Garden'
    )

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    const text = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0]
    expect(text.split('\n').slice(0, 2)).toEqual([
      'Wor\uD83D\uDC9Adle 2026-01',
      'Event: Summer Garden',
    ])
  })
})

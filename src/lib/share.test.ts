import { generateShareText } from './share'

const guesses = [['c', 'h', 'a', 'i', 'n']]

describe('share header badge', () => {
  beforeEach(() => {
    localStorage.clear()
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

    expect(text.split('\n')[0]).toBe('Wor\uD83E\uDE75dle 2026-05-09 1/6')
    expect(localStorage.getItem('cosmeticState')).toContain('badge_fire')
  })
})

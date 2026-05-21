import { getLoseReasonIcon } from './loseReasons'

describe('lose reason icons', () => {
  it('uses the default Daily lose reason icons', () => {
    expect(getLoseReasonIcon('guess_limit')).toBe('❌')
    expect(getLoseReasonIcon('dead_end')).toBe('🦎')
    expect(getLoseReasonIcon('unknown')).toBe('❓')
  })

  it('uses event-specific lose reason icons when provided', () => {
    expect(
      getLoseReasonIcon('pacman', [
        {
          id: 'pacman',
          icon: '🐇',
          titleKey: 'loseReasonPacman',
          infoKey: 'loseReasonPacmanInfo',
          colorClass: 'bg-purple-500 text-purple-50',
        },
        {
          id: 'unknown',
          icon: '❔',
          titleKey: 'loseReasonUnknown',
          infoKey: 'loseReasonUnknownInfoBody',
          colorClass: 'bg-gray-400 text-gray-50',
          isUnknown: true,
        },
      ])
    ).toBe('🐇')
  })

  it('falls back to the event unknown icon before the default unknown icon', () => {
    expect(
      getLoseReasonIcon('future_reason', [
        {
          id: 'unknown',
          icon: '❔',
          titleKey: 'loseReasonUnknown',
          infoKey: 'loseReasonUnknownInfoBody',
          colorClass: 'bg-gray-400 text-gray-50',
          isUnknown: true,
        },
      ])
    ).toBe('❔')
  })
})

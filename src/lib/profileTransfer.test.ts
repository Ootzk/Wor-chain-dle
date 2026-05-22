import {
  createProfileExportString,
  decodeProfile,
  getProfileImportPreview,
  importProfile,
} from './profileTransfer'

describe('profile transfer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exports an allowlisted profile string', () => {
    localStorage.setItem(
      'dailyResults',
      JSON.stringify({
        '2026-05-21': {
          dateKey: '2026-05-21',
          won: true,
          guessCount: 3,
          endReason: 'win',
        },
      })
    )
    localStorage.setItem(
      'gameStats',
      JSON.stringify({
        winDistribution: [0, 0, 1, 0, 0, 0],
        gamesFailed: 0,
        currentStreak: 1,
        bestStreak: 1,
        totalGames: 1,
        successRate: 100,
      })
    )
    localStorage.setItem('gameState', JSON.stringify({ solution: 'chain' }))
    localStorage.setItem('seenPatchNotesVersion', '1.6.0')

    const exported = createProfileExportString()
    const profile = decodeProfile(exported)

    expect(exported.startsWith('WCD1:')).toBe(true)
    expect(profile.data.dailyResults).toHaveProperty('2026-05-21')
    expect(profile.data).not.toHaveProperty('gameState')
    expect(profile.data).not.toHaveProperty('seenPatchNotesVersion')
  })

  it('previews profile contents', () => {
    localStorage.setItem(
      'dailyResults',
      JSON.stringify({
        '2026-05-21': {
          dateKey: '2026-05-21',
          won: true,
          guessCount: 3,
          endReason: 'win',
        },
      })
    )
    localStorage.setItem(
      'eventResults',
      JSON.stringify({
        'v1.7.0': {
          '2026-05-22': {
            dateKey: '2026-05-22',
            won: false,
            guessCount: 2,
            endReason: 'pacman',
          },
        },
      })
    )
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 'v1.7.0',
        unlocked: { play_10: { unlockedAt: 1 } },
        retroCompleted: true,
      })
    )

    const preview = getProfileImportPreview(createProfileExportString())

    expect(preview.dailyResults).toBe(1)
    expect(preview.eventResults).toBe(1)
    expect(preview.achievements).toBe(1)
  })

  it('merges records and unions known achievements on import', () => {
    localStorage.setItem(
      'dailyResults',
      JSON.stringify({
        '2026-05-20': {
          dateKey: '2026-05-20',
          won: false,
          guessCount: 6,
          endReason: 'unknown',
        },
      })
    )
    localStorage.setItem(
      'achievementState',
      JSON.stringify({
        version: 'v1.7.0',
        unlocked: { play_10: { unlockedAt: 20 } },
        retroCompleted: true,
      })
    )

    const sourceProfile = {
      schemaVersion: 1,
      appVersion: '1.6.0',
      exportedAt: '2026-05-22T00:00:00.000Z',
      data: {
        dailyResults: {
          '2026-05-21': {
            dateKey: '2026-05-21',
            won: true,
            guessCount: 3,
            endReason: 'win',
          },
        },
        achievementState: {
          version: 'v1.7.0',
          unlocked: {
            play_50: { unlockedAt: 10 },
            unknown_future_id: { unlockedAt: 10 },
          },
          retroCompleted: true,
        },
      },
    }

    const sourceString = `WCD1:${btoa(JSON.stringify(sourceProfile))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')}`

    const result = importProfile(sourceString)

    expect(result.backup.startsWith('WCD1:')).toBe(true)
    expect(
      JSON.parse(localStorage.getItem('dailyResults') || '{}')
    ).toHaveProperty('2026-05-20')
    expect(
      JSON.parse(localStorage.getItem('dailyResults') || '{}')
    ).toHaveProperty('2026-05-21')
    expect(
      JSON.parse(localStorage.getItem('achievementState') || '{}').unlocked
    ).toMatchObject({
      play_10: { unlockedAt: 20 },
      play_50: { unlockedAt: 10 },
    })
    expect(
      JSON.parse(localStorage.getItem('achievementState') || '{}').unlocked
    ).not.toHaveProperty('unknown_future_id')
  })
})

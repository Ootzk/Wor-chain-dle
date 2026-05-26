import {
  collectEventTargetsForSubmission,
  formatCollectibleDashboardCount,
  getCollectibleCellEffects,
  getCollectibleProgressItemId,
  getCollectibleProgressItemIds,
  getCollectibleRowEffects,
  getEventCollectibleTargets,
  mergeCollectedRows,
  EventCollectibleConfig,
} from './eventCollectibles'

const cloverConfig: EventCollectibleConfig = {
  id: 'clover',
  collectionId: 'v1.7.0-summer-garden-clover',
  emoji: '🍀',
  targetRows: [1, 2, 3, 4, 5],
  winBonusItemId: 'win_bonus',
  collectStatus: 'correct',
  autoCollectRemainingOnWin: true,
}

describe('event collectibles', () => {
  it('places deterministic collectible targets by event and date', () => {
    const targets = getEventCollectibleTargets({
      eventId: 'v1.7.0-event',
      dateKey: '2026-05-21',
      collectibles: [cloverConfig],
    })

    expect(targets).toHaveLength(5)
    expect(targets.map((target) => target.rowIndex)).toEqual([1, 2, 3, 4, 5])
    expect(new Set(targets.map((target) => target.colIndex)).size).toBe(5)
    expect(targets).toEqual(
      getEventCollectibleTargets({
        eventId: 'v1.7.0-event',
        dateKey: '2026-05-21',
        collectibles: [cloverConfig],
      })
    )
    expect(targets).not.toEqual(
      getEventCollectibleTargets({
        eventId: 'v1.7.0-event',
        dateKey: '2026-05-22',
        collectibles: [cloverConfig],
      })
    )
  })

  it('renders unsubmitted targets as cell values and collected targets as row prefixes', () => {
    const targets = [
      {
        collectibleId: 'clover',
        collectionId: cloverConfig.collectionId,
        emoji: '🍀',
        rowIndex: 1,
        colIndex: 3,
      },
      {
        collectibleId: 'clover',
        collectionId: cloverConfig.collectionId,
        emoji: '🍀',
        rowIndex: 2,
        colIndex: 0,
      },
    ]
    const collectedRows = { clover: [1] }

    expect(
      getCollectibleCellEffects({ targets, collectedRows, submittedRows: 1 })
    ).toEqual({
      '2:0': { value: '🍀' },
    })
    expect(getCollectibleRowEffects({ targets, collectedRows })).toEqual({
      1: { prefix: '🍀' },
    })
  })

  it('collects a row only when the target tile is correct', () => {
    const targets = [
      {
        collectibleId: 'clover',
        collectionId: cloverConfig.collectionId,
        emoji: '🍀',
        rowIndex: 1,
        colIndex: 0,
      },
    ]

    expect(
      collectEventTargetsForSubmission({
        config: cloverConfig,
        targets,
        submittedRowIndex: 1,
        submittedGuess: ['s', 't', 'a', 'l', 'e'],
        solution: 'spear',
        won: false,
        collectedRows: {},
      })
    ).toEqual([1])

    expect(
      collectEventTargetsForSubmission({
        config: cloverConfig,
        targets,
        submittedRowIndex: 1,
        submittedGuess: ['s', 't', 'a', 'l', 'e'],
        solution: 'crane',
        won: false,
        collectedRows: {},
      })
    ).toEqual([])
  })

  it('auto-collects remaining target rows on early win', () => {
    const targets = [1, 2, 3, 4, 5].map((rowIndex) => ({
      collectibleId: 'clover',
      collectionId: cloverConfig.collectionId,
      emoji: '🍀',
      rowIndex,
      colIndex: 0,
    }))

    expect(
      collectEventTargetsForSubmission({
        config: cloverConfig,
        targets,
        submittedRowIndex: 0,
        submittedGuess: ['s', 'p', 'e', 'a', 'r'],
        solution: 'spear',
        won: true,
        collectedRows: {},
      })
    ).toEqual([1, 2, 3, 4, 5])
  })

  it('merges collected rows and maps them to progress item ids', () => {
    expect(mergeCollectedRows({ clover: [1] }, 'clover', [1, 3])).toEqual({
      clover: [1, 3],
    })
    expect(getCollectibleProgressItemId(1)).toBe('row_2')
  })

  it('adds a win bonus progress item without requiring a collected row', () => {
    expect(
      getCollectibleProgressItemIds({
        rowIndexes: [],
        won: true,
        winBonusItemId: 'win_bonus',
      })
    ).toEqual(['win_bonus'])
    expect(
      getCollectibleProgressItemIds({
        rowIndexes: [1, 3],
        won: true,
        winBonusItemId: 'win_bonus',
      })
    ).toEqual(['row_2', 'row_4', 'win_bonus'])
    expect(
      getCollectibleProgressItemIds({
        rowIndexes: [1],
        won: false,
        winBonusItemId: 'win_bonus',
      })
    ).toEqual(['row_2'])
  })

  it('formats collectible dashboard counts with a separate win bonus marker', () => {
    expect(
      formatCollectibleDashboardCount({
        emoji: '🍀',
        count: 4,
        winBonusCount: 0,
      })
    ).toBe('🍀4')
    expect(
      formatCollectibleDashboardCount({
        emoji: '🍀',
        count: 4,
        winBonusCount: 1,
      })
    ).toBe('🍀5 (+1)')
    expect(
      formatCollectibleDashboardCount({
        emoji: '🍀',
        count: 0,
        winBonusCount: 0,
      })
    ).toBe('🍀0')
  })
})

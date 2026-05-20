import { ACHIEVEMENTS } from './achievements'
import { COSMETIC_OPTIONS } from './cosmetics'
import { RELEASE_METADATA } from './releaseMetadata'
import {
  filterRewardsByMetadata,
  getRewardMetadataLabel,
} from './rewardMetadata'

describe('reward metadata', () => {
  it('tracks introduced version for every achievement and cosmetic option', () => {
    expect(ACHIEVEMENTS.every((a) => a.metadata?.introducedInVersion)).toBe(
      true
    )
    expect(
      COSMETIC_OPTIONS.every((option) => option.metadata?.introducedInVersion)
    ).toBe(true)
  })

  it('filters v1.7.0 achievement metadata', () => {
    const achievementIds = filterRewardsByMetadata(ACHIEVEMENTS, {
      introducedInVersion: '1.7.0',
    })
      .map((achievement) => achievement.id)
      .sort()

    expect(achievementIds).toEqual(
      [
        'clover_collector',
        'no_correct_game',
        'no_present_game',
        'played_v1_7_0_5',
        'streak_5',
        'win_in_6_20',
      ].sort()
    )
  })

  it('filters v1.7.0 cosmetic metadata', () => {
    const cosmeticIds = filterRewardsByMetadata(COSMETIC_OPTIONS, {
      introducedInVersion: '1.7.0',
    }).map((option) => option.id)

    expect(cosmeticIds.sort()).toEqual(
      [
        'badge_apple',
        'badge_azure',
        'badge_clover',
        'badge_grape',
        'badge_milk',
        'chaincolor_azure',
      ].sort()
    )
  })

  it('keeps release-level theme and event metadata separate from rewards', () => {
    expect(RELEASE_METADATA['1.7.0']).toMatchObject({
      theme: 'summer garden',
    })
  })

  it('formats reward metadata labels from release metadata', () => {
    expect(getRewardMetadataLabel({ introducedInVersion: '1.7.0' })).toBe(
      'v1.7.0 (summer garden)'
    )
    expect(getRewardMetadataLabel({ introducedInVersion: '1.3.0' })).toBe(
      'v1.3.0'
    )
  })
})

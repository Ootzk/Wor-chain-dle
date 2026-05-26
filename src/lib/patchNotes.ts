import { RELEASE_METADATA } from './releaseMetadata'

export type PatchNoteFeature = {
  icon: string
  titleKey: string
  descKey: string
  eventGuideVersion?: string
  sub?: readonly PatchNoteFeature[]
}

export type PatchNote = {
  version: string
  features: readonly PatchNoteFeature[]
}

export type PatchNoteVersion = PatchNote & {
  releasedAt: string
}

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: '1.7.0',
    features: [
      {
        icon: '🎪',
        titleKey: 'patchNote_eventMode_title',
        descKey: 'patchNote_eventMode_desc',
      },
      {
        icon: '',
        titleKey: 'eventSummerGardenInfoTitle',
        descKey: 'eventSummerGardenStoryQuote',
        eventGuideVersion: 'v1.7.0',
      },
      {
        icon: '📊',
        titleKey: 'patchNote_recordsDashboard_title',
        descKey: 'patchNote_recordsDashboard_desc',
      },
      {
        icon: '🏆',
        titleKey: 'patchNote_rewardsHub_title',
        descKey: 'patchNote_rewardsHub_desc',
      },
      {
        icon: '🔁',
        titleKey: 'patchNote_profileManagement_title',
        descKey: 'patchNote_profileManagement_desc',
      },
    ],
  },
  {
    version: '1.6.0',
    features: [
      {
        icon: '📝',
        titleKey: 'patchNote_updateHistory_title',
        descKey: 'patchNote_updateHistory_desc',
      },
      {
        icon: '🏷️',
        titleKey: 'patchNote_shareBadges_title',
        descKey: 'patchNote_shareBadges_desc',
      },
      {
        icon: '🧩',
        titleKey: 'patchNote_newAchievements_title',
        descKey: 'patchNote_newAchievements_desc',
      },
      {
        icon: '🍚',
        titleKey: 'patchNote_recipeEmoji_title',
        descKey: 'patchNote_recipeEmoji_desc',
      },
    ],
  },
  {
    version: '1.5.0',
    features: [
      {
        icon: '🏆',
        titleKey: 'patchNote_achievements_title',
        descKey: 'patchNote_achievements_desc',
      },
      {
        icon: '🎨',
        titleKey: 'patchNote_cosmetics_title',
        descKey: 'patchNote_cosmetics_desc',
      },
      {
        icon: '🇩🇪',
        titleKey: 'patchNote_german_title',
        descKey: 'patchNote_german_desc',
      },
      {
        icon: '🔧',
        titleKey: 'patchNote_uiFixes_title',
        descKey: 'patchNote_uiFixes_desc',
      },
    ],
  },
  {
    version: '1.4.0',
    features: [
      {
        icon: '🕛',
        titleKey: 'patchNote_localTimezone_title',
        descKey: 'patchNote_localTimezone_desc',
      },
      {
        icon: '🧭',
        titleKey: 'patchNote_uiRefactor_title',
        descKey: 'patchNote_uiRefactor_desc',
      },
      {
        icon: '💖',
        titleKey: 'patchNote_sponsors_title',
        descKey: 'patchNote_sponsors_desc',
      },
    ],
  },
  {
    version: '1.3.0',
    features: [
      {
        icon: '📅',
        titleKey: 'patchNote_calendar_title',
        descKey: 'patchNote_calendar_desc',
      },
    ],
  },
  {
    version: '1.2.0',
    features: [
      {
        icon: '🧩',
        titleKey: 'patchNote_customPuzzle_title',
        descKey: 'patchNote_customPuzzle_desc',
      },
      {
        icon: '💝',
        titleKey: 'patchNote_donations_title',
        descKey: 'patchNote_donations_desc',
        sub: [
          {
            icon: '💛',
            titleKey: 'patchNote_kakaopay_title',
            descKey: 'patchNote_kakaopay_desc',
          },
          {
            icon: '💙',
            titleKey: 'patchNote_tosspay_title',
            descKey: 'patchNote_tosspay_desc',
          },
        ],
      },
      {
        icon: 'ℹ️',
        titleKey: 'patchNote_infoModal_title',
        descKey: 'patchNote_infoModal_desc',
      },
      {
        icon: '✨',
        titleKey: 'patchNote_ui_title',
        descKey: 'patchNote_ui_desc',
        sub: [
          {
            icon: '🏷️',
            titleKey: 'patchNote_subtitle_title',
            descKey: 'patchNote_subtitle_desc',
          },
          {
            icon: '🏳️',
            titleKey: 'patchNote_flags_title',
            descKey: 'patchNote_flags_desc',
          },
        ],
      },
    ],
  },
]

export const getPatchNoteVersions = (): PatchNoteVersion[] =>
  PATCH_NOTES.map((patchNote) => ({
    ...patchNote,
    releasedAt: RELEASE_METADATA[patchNote.version]?.releasedAt ?? '',
  }))

export const getCurrentPatchNotes = (version: string): PatchNoteVersion => {
  const patchNoteVersions = getPatchNoteVersions()
  return (
    patchNoteVersions.find((patchNote) => patchNote.version === version) ??
    patchNoteVersions[0]
  )
}

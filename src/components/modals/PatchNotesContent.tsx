import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/outline'
import { PATCH_NOTES_VERSION } from '../../constants/config'
import { useTranslation } from 'react-i18next'

type Feature = {
  icon: string
  titleKey: string
  descKey: string
  sub?: { icon: string; titleKey: string; descKey: string }[]
}

type PatchNoteVersion = {
  version: string
  releasedAt: string
  features: Feature[]
}

const patchNoteVersions: PatchNoteVersion[] = [
  {
    version: '1.6.0',
    releasedAt: '2026-05-10',
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
    releasedAt: '2026-04-20',
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
    releasedAt: '2026-03-12',
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
    releasedAt: '2026-03-07',
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
    releasedAt: '2026-02-28',
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

const currentPatchNotes =
  patchNoteVersions.find(({ version }) => version === PATCH_NOTES_VERSION) ??
  patchNoteVersions[0]

const PatchNoteFeatureCard = ({ feature }: { feature: Feature }) => {
  const { t } = useTranslation()
  const { icon, titleKey, descKey, sub } = feature

  return (
    <div key={titleKey} className="rounded-lg border border-gray-200 p-3">
      <div className="flex gap-3">
        <span className="text-xl leading-none">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{t(titleKey)}</p>
          <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">
            {t(descKey)}
          </p>
        </div>
      </div>
      {sub && (
        <div className="ml-8 mt-2 space-y-2">
          {sub.map((s) => (
            <div key={s.titleKey} className="flex gap-2">
              {s.icon && <span className="text-sm leading-none">{s.icon}</span>}
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  {t(s.titleKey)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{t(s.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type Props = {
  variant?: 'current' | 'history'
}

export const PatchNotesContent = ({ variant = 'current' }: Props) => {
  if (variant === 'history') {
    return (
      <div className="space-y-3 text-left">
        {patchNoteVersions.map(({ version, releasedAt, features }, index) => (
          <Disclosure key={version} defaultOpen={index === 0}>
            {({ open }) => (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 bg-gray-50 px-3 py-2 text-left">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      v{version}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {releasedAt}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="space-y-3 p-3">
                  {features.map((feature) => (
                    <PatchNoteFeatureCard
                      key={`${version}-${feature.titleKey}`}
                      feature={feature}
                    />
                  ))}
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          v{currentPatchNotes.version}
        </span>
        <span className="text-xs font-medium text-gray-500">
          {currentPatchNotes.releasedAt}
        </span>
      </div>

      <div className="space-y-3 text-left">
        {currentPatchNotes.features.map((feature) => (
          <PatchNoteFeatureCard key={feature.titleKey} feature={feature} />
        ))}
      </div>
    </>
  )
}

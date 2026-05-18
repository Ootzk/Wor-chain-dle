import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/outline'
import { PATCH_NOTES_VERSION } from '../../constants/config'
import {
  getCurrentPatchNotes,
  getPatchNoteVersions,
} from '../../lib/patchNotes'
import type { PatchNoteFeature } from '../../lib/patchNotes'
import { useTranslation } from 'react-i18next'

const patchNoteVersions = getPatchNoteVersions()
const currentPatchNotes = getCurrentPatchNotes(PATCH_NOTES_VERSION)

const PatchNoteFeatureCard = ({ feature }: { feature: PatchNoteFeature }) => {
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

import { BaseModal } from './BaseModal'
import { SparklesIcon } from '@heroicons/react/outline'
import { PATCH_NOTES_VERSION } from '../../constants/config'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

type Feature = {
  icon: string
  titleKey: string
  descKey: string
  sub?: { icon: string; titleKey: string; descKey: string }[]
}

const features: Feature[] = [
  {
    icon: '🕛',
    titleKey: 'patchNote_localTimezone_title',
    descKey: 'patchNote_localTimezone_desc',
  },
  {
    icon: '🎨',
    titleKey: 'patchNote_uiRefactor_title',
    descKey: 'patchNote_uiRefactor_desc',
  },
  {
    icon: '❤️',
    titleKey: 'patchNote_sponsors_title',
    descKey: 'patchNote_sponsors_desc',
  },
]

export const PatchNotesModal = ({ isOpen, handleClose }: Props) => {
  const { t } = useTranslation()
  return (
    <BaseModal
      title={t('patchNotesTitle')}
      icon={<SparklesIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 mb-4">
        v{PATCH_NOTES_VERSION}
      </div>

      <div className="space-y-3 text-left">
        {features.map(({ icon, titleKey, descKey, sub }) => (
          <div
            key={titleKey}
            className="rounded-lg border border-gray-200 p-3"
          >
            <div className="flex gap-3">
              <span className="text-xl leading-none">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {t(titleKey)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{t(descKey)}</p>
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
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t(s.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </BaseModal>
  )
}

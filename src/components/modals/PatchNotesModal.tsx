import { BaseModal } from './BaseModal'
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
    icon: '\u{1F3AE}',
    titleKey: 'patchNote_practice_title',
    descKey: 'patchNote_practice_desc',
  },
  {
    icon: '\u{2699}\u{FE0F}',
    titleKey: 'patchNote_settings_title',
    descKey: 'patchNote_settings_desc',
    sub: [
      {
        icon: '\u{1F520}',
        titleKey: 'patchNote_uppercase_title',
        descKey: 'patchNote_uppercase_desc',
      },
    ],
  },
  {
    icon: '\u{2615}',
    titleKey: 'patchNote_donate_title',
    descKey: 'patchNote_donate_desc',
  },
]

export const PatchNotesModal = ({ isOpen, handleClose }: Props) => {
  const { t } = useTranslation()
  return (
    <BaseModal
      title={t('patchNotesTitle')}
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
                    <span className="text-sm leading-none">{s.icon}</span>
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

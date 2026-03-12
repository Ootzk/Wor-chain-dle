import { BaseModal } from './BaseModal'
import { CogIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../constants/config'
import { localeLanguageKey } from '../../i18n'

const langFlags: Record<string, string> = {
  en: '🇺🇸🇬🇧',
  ko: '🇰🇷',
  ja: '🇯🇵',
  es: '🇪🇸',
  sw: '🇹🇿🇰🇪',
  zh: '🇨🇳',
}

type Props = {
  isOpen: boolean
  handleClose: () => void
  isUppercase: boolean
  onToggleUppercase: () => void
  weekStartsOnMonday: boolean
  onToggleWeekStart: () => void
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
}

const Toggle = ({
  checked,
  onClick,
}: {
  checked: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    }`}
    onClick={onClick}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)

export const SettingsModal = ({
  isOpen,
  handleClose,
  isUppercase,
  onToggleUppercase,
  weekStartsOnMonday,
  onToggleWeekStart,
  excludeUrl,
  onToggleExcludeUrl,
}: Props) => {
  const { t, i18n } = useTranslation()

  return (
    <BaseModal title={t('settings')} icon={<CogIcon />} isOpen={isOpen} handleClose={handleClose}>
      <div className="mt-2">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-700">
            {t('uppercaseLabel')}
          </span>
          <Toggle checked={isUppercase} onClick={onToggleUppercase} />
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-700">
            {t('weekStartLabel')}
          </span>
          <Toggle checked={weekStartsOnMonday} onClick={onToggleWeekStart} />
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-700">
            {t('excludeUrlLabel')}
          </span>
          <Toggle checked={excludeUrl} onClick={onToggleExcludeUrl} />
        </div>
        {CONFIG.availableLangs.length > 1 && (
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-gray-700">
              {t('pickYourLanguage')}
            </span>
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={i18n.language?.split('-')[0]}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value)
                localStorage.setItem(localeLanguageKey, e.target.value)
              }}
            >
              {CONFIG.availableLangs.map((lang) => (
                <option key={lang} value={lang}>
                  {langFlags[lang]} {t(`languages.${lang}`)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

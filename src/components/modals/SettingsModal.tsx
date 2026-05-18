import { useState } from 'react'
import { BaseModal } from './BaseModal'
import { CogIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../constants/config'
import { localeLanguageKey } from '../../i18n'

const langFlags: Record<string, string> = {
  en: '\uD83C\uDDFA\uD83C\uDDF8\uD83C\uDDEC\uD83C\uDDE7',
  ko: '\uD83C\uDDF0\uD83C\uDDF7',
  ja: '\uD83C\uDDEF\uD83C\uDDF5',
  es: '\uD83C\uDDEA\uD83C\uDDF8',
  sw: '\uD83C\uDDF9\uD83C\uDDFF\uD83C\uDDF0\uD83C\uDDEA',
  zh: '\uD83C\uDDE8\uD83C\uDDF3',
  de: '\uD83C\uDDE9\uD83C\uDDEA',
}

type Props = {
  isOpen: boolean
  handleClose: () => void
  isUppercase: boolean
  onToggleUppercase: () => void
  weekStartsOnMonday: boolean
  onToggleWeekStartsOnMonday: () => void
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
  enterValidationHint: boolean
  onToggleEnterValidationHint: () => void
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
  onToggleWeekStartsOnMonday,
  excludeUrl,
  onToggleExcludeUrl,
  enterValidationHint,
  onToggleEnterValidationHint,
}: Props) => {
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)

  return (
    <BaseModal
      title={t('settings')}
      icon={<CogIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Language */}
        {CONFIG.availableLangs.length > 1 && (
          <>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">
                {t('pickYourLanguage')}
              </span>
              <button
                type="button"
                className="w-36 flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                onClick={() => setIsLangOpen(true)}
              >
                <span className="flex items-center justify-between w-full">
                  <span className="flex items-center">
                    {langFlags[i18n.language?.split('-')[0]] || ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="truncate">
                      {t(`languages.${i18n.language?.split('-')[0]}`)}
                    </span>
                    <span className="text-xs text-gray-400">{'\u25BE'}</span>
                  </span>
                </span>
              </button>
            </div>
            {isLangOpen && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30"
                onClick={() => setIsLangOpen(false)}
              >
                <div
                  className="bg-white rounded-lg shadow-xl w-72 max-h-96 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-bold text-gray-900">
                      {t('pickYourLanguage')}
                    </span>
                  </div>
                  {CONFIG.availableLangs.map((lang) => {
                    const selected = i18n.language?.split('-')[0] === lang
                    return (
                      <button
                        key={lang}
                        type="button"
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-gray-50 ${
                          selected
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        onClick={() => {
                          i18n.changeLanguage(lang)
                          localStorage.setItem(localeLanguageKey, lang)
                          setIsLangOpen(false)
                        }}
                      >
                        <span className="flex-shrink-0 flex items-center">
                          {langFlags[lang]}
                        </span>
                        <span className="flex-1 text-right">
                          {t(`languages.${lang}`)}
                        </span>
                        <span className="w-5 text-center flex-shrink-0">
                          {selected && (
                            <span className="text-indigo-600">{'\u2713'}</span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Display settings */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('uppercaseLabel')}
          </span>
          <Toggle checked={isUppercase} onClick={onToggleUppercase} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('weekStartLabel')}
          </span>
          <Toggle
            checked={weekStartsOnMonday}
            onClick={onToggleWeekStartsOnMonday}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('excludeUrlLabel')}
          </span>
          <Toggle checked={excludeUrl} onClick={onToggleExcludeUrl} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('enterValidationHintLabel')}
          </span>
          <Toggle
            checked={enterValidationHint}
            onClick={onToggleEnterValidationHint}
          />
        </div>
      </div>
    </BaseModal>
  )
}

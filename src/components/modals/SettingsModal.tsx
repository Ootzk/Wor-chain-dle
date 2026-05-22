import { ReactNode, useState } from 'react'
import { createPortal } from 'react-dom'
import { BaseModal } from './BaseModal'
import { ChevronDownIcon, CogIcon } from '@heroicons/react/outline'
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
  isDarkMode: boolean
  onToggleDarkMode: () => void
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

const SettingRow = ({
  label,
  description,
  caution,
  secondaryCaution,
  children,
}: {
  label: string
  description?: string
  caution?: string
  secondaryCaution?: string
  children: ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="min-w-0 text-left">
      <div className="text-sm font-medium text-gray-900">{label}</div>
      {description && (
        <div className="mt-1 text-xs leading-4 text-gray-500">
          {description}
        </div>
      )}
      {caution && (
        <div className="mt-1 text-xs leading-4 text-purple-600">{caution}</div>
      )}
      {secondaryCaution && (
        <div className="mt-1 text-xs leading-4 text-purple-600">
          {secondaryCaution}
        </div>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
)

const SettingsGroupTitle = ({
  children,
  separated = false,
}: {
  children: ReactNode
  separated?: boolean
}) => (
  <div
    className={`pb-1 text-left text-xs font-bold uppercase tracking-wide text-gray-400 ${
      separated ? 'mt-3 border-t border-gray-200 pt-4' : ''
    }`}
  >
    {children}
  </div>
)

export const SettingsModal = ({
  isOpen,
  handleClose,
  isUppercase,
  onToggleUppercase,
  isDarkMode,
  onToggleDarkMode,
  weekStartsOnMonday,
  onToggleWeekStartsOnMonday,
  excludeUrl,
  onToggleExcludeUrl,
  enterValidationHint,
  onToggleEnterValidationHint,
}: Props) => {
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const closeSettings = () => {
    setIsLangOpen(false)
    handleClose()
  }
  const languagePicker =
    isOpen && isLangOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30 px-4"
            onClick={() => setIsLangOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-72 max-h-[80vh] overflow-y-auto"
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
          </div>,
          document.body
        )
      : null

  return (
    <>
      <BaseModal
        title={t('settings')}
        icon={<CogIcon />}
        isOpen={isOpen}
        handleClose={closeSettings}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Language */}
          {CONFIG.availableLangs.length > 1 && (
            <>
              <SettingsGroupTitle>
                {t('languageSettingsGroup')}
              </SettingsGroupTitle>
              <SettingRow label={t('pickYourLanguage')}>
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
                      <ChevronDownIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    </span>
                  </span>
                </button>
              </SettingRow>
            </>
          )}

          <SettingsGroupTitle separated>
            {t('displaySharingSettingsGroup')}
          </SettingsGroupTitle>
          <SettingRow
            label={t('uppercaseLabel')}
            description={t('uppercaseDescription')}
          >
            <Toggle checked={isUppercase} onClick={onToggleUppercase} />
          </SettingRow>
          {/*
            Dark mode support is implemented, but the Settings entry stays
            hidden in v1.7.0 so the later horror Event theme can introduce it
            with stronger impact. Re-enable this row when the theme is ready.
            <SettingRow
              label={t('darkModeLabel')}
              description={t('darkModeDescription')}
            >
              <Toggle checked={isDarkMode} onClick={onToggleDarkMode} />
            </SettingRow>
          */}
          <SettingRow
            label={t('excludeUrlLabel')}
            description={t('excludeUrlDescription')}
          >
            <Toggle checked={excludeUrl} onClick={onToggleExcludeUrl} />
          </SettingRow>

          <SettingsGroupTitle separated>
            {t('calendarSettingsGroup')}
          </SettingsGroupTitle>
          <SettingRow
            label={t('weekStartLabel')}
            description={t('weekStartDescription')}
          >
            <Toggle
              checked={weekStartsOnMonday}
              onClick={onToggleWeekStartsOnMonday}
            />
          </SettingRow>

          <SettingsGroupTitle separated>
            {t('gameplaySettingsGroup')}
          </SettingsGroupTitle>
          <SettingRow
            label={t('enterValidationHintLabel')}
            description={t('enterValidationHintDescription')}
            caution={t('enterValidationHintCaution')}
            secondaryCaution={t('enterValidationHintModeCaution')}
          >
            <Toggle
              checked={enterValidationHint}
              onClick={onToggleEnterValidationHint}
            />
          </SettingRow>
        </div>
      </BaseModal>
      {languagePicker}
    </>
  )
}

import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { BaseModal } from './BaseModal'
import { CheckIcon, ChevronDownIcon, CogIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../constants/config'
import { localeLanguageKey } from '../../i18n'
import {
  createProfileExportString,
  getProfileImportPreview,
  importProfile,
  ProfileImportPreview,
} from '../../lib/profileTransfer'

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
  controllerEnabled: boolean
  onToggleControllerEnabled: () => void
  onResetSettings: () => void
  onResetCosmetics: () => void
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
  details,
  caution,
  secondaryCaution,
  children,
}: {
  label: string
  description?: string
  details?: string[]
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
      {details?.map((detail) => (
        <div key={detail} className="mt-1 text-xs leading-4 text-gray-500">
          {detail}
        </div>
      ))}
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
  controllerEnabled,
  onToggleControllerEnabled,
  onResetSettings,
  onResetCosmetics,
}: Props) => {
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [profileImport, setProfileImport] = useState('')
  const [profilePreview, setProfilePreview] =
    useState<ProfileImportPreview | null>(null)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileImported, setProfileImported] = useState(false)
  const [isFormatConfirmOpen, setIsFormatConfirmOpen] = useState(false)
  const [resetCosmeticsMessage, setResetCosmeticsMessage] = useState('')
  const [resetSettingsMessage, setResetSettingsMessage] = useState('')
  const closeSettings = () => {
    setIsLangOpen(false)
    handleClose()
  }
  const resetProfileStatus = () => {
    setProfileMessage('')
    setProfileError('')
    setProfileImported(false)
  }
  const getProfileErrorMessage = (error: unknown) => {
    if (error instanceof Error && i18n.exists(error.message)) {
      return t(error.message)
    }
    return t('profileImportInvalidGeneric')
  }
  const copyProfileText = async (value: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        return true
      }
    } catch {
      // Fall through to the legacy copy path.
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copied
    } catch {
      return false
    }
  }
  const handleProfileExport = async () => {
    resetProfileStatus()
    const value = createProfileExportString()
    const copied = await copyProfileText(value)
    if (copied) {
      setProfileMessage(t('profileExportCopied'))
    } else {
      setProfileError(t('profileExportCopyFailed'))
    }
  }
  const updateProfileImport = (value: string) => {
    setProfileImport(value)
    resetProfileStatus()
    if (!value.trim()) {
      setProfilePreview(null)
      return
    }

    try {
      setProfilePreview(getProfileImportPreview(value))
    } catch (error) {
      setProfilePreview(null)
      setProfileError(getProfileErrorMessage(error))
    }
  }
  const handleProfileImport = async () => {
    resetProfileStatus()
    try {
      const result = importProfile(profileImport)
      await copyProfileText(result.backup)
      setProfilePreview(result)
      setProfileImported(true)
      setProfileMessage(t('profileImportSuccess'))
    } catch (error) {
      setProfileError(getProfileErrorMessage(error))
    }
  }
  const handleResetCosmetics = () => {
    onResetCosmetics()
    setResetCosmeticsMessage(t('resetCosmeticsSuccess'))
  }
  const handleResetSettings = () => {
    onResetSettings()
    setResetSettingsMessage(t('resetSettingsSuccess'))
  }
  const handleFormatProfile = () => {
    localStorage.clear()
    window.location.reload()
  }
  useEffect(() => {
    if (!resetCosmeticsMessage) return undefined
    const timer = window.setTimeout(() => setResetCosmeticsMessage(''), 2500)
    return () => window.clearTimeout(timer)
  }, [resetCosmeticsMessage])

  useEffect(() => {
    if (!resetSettingsMessage) return undefined
    const timer = window.setTimeout(() => setResetSettingsMessage(''), 2500)
    return () => window.clearTimeout(timer)
  }, [resetSettingsMessage])

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
                        <CheckIcon className="mx-auto h-5 w-5 text-indigo-600" />
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
          <SettingRow
            label={t('controllerEnabledLabel')}
            description={t('controllerEnabledDescription')}
            details={[
              t('controllerEnabledLettersDescription'),
              t('controllerEnabledLiveDescription'),
            ]}
          >
            <Toggle
              checked={controllerEnabled}
              onClick={onToggleControllerEnabled}
            />
          </SettingRow>

          <SettingsGroupTitle separated>
            {t('profileTransferSettingsGroup')}
          </SettingsGroupTitle>
          <div className="space-y-4 py-3 text-left">
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {t('profileExportTitle')}
                </div>
                <p className="mt-1 text-xs leading-4 text-gray-500">
                  {t('profileExportDescription')}
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                onClick={handleProfileExport}
              >
                {t('profileExportButton')}
              </button>

              {profileMessage && (
                <div className="text-xs font-medium text-green-500">
                  {profileMessage}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {t('profileImportTitle')}
                </div>
                <p className="mt-1 text-xs leading-4 text-gray-500">
                  {t('profileImportDescription')}
                </p>
              </div>

              <textarea
                className="h-20 w-full resize-none rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500"
                value={profileImport}
                onChange={(event) => updateProfileImport(event.target.value)}
                placeholder={t('profileImportPlaceholder')}
                aria-label={t('profileImportLabel')}
              />

              {profilePreview && (
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs leading-5 text-gray-600">
                  <div className="font-semibold text-gray-800">
                    {t('profilePreviewTitle')}
                  </div>
                  <div>
                    {t('profilePreviewVersion')}: {profilePreview.appVersion}
                  </div>
                  <div>
                    {t('profilePreviewExportedAt')}:{' '}
                    {profilePreview.exportedAt.replace('T', ' ').slice(0, 16)}
                  </div>
                  <div>
                    {t('profilePreviewDaily')}: {profilePreview.dailyResults}
                  </div>
                  <div>
                    {t('profilePreviewEvent')}: {profilePreview.eventResults}
                  </div>
                  <div>
                    {t('profilePreviewAchievements')}:{' '}
                    {profilePreview.achievements}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white disabled:shadow-none disabled:hover:bg-gray-300"
                disabled={!profilePreview}
                onClick={handleProfileImport}
              >
                {t('profileImportButton')}
              </button>

              {profileError && (
                <div className="text-xs font-medium text-purple-600">
                  {profileError}
                </div>
              )}
              {profileImported && (
                <button
                  type="button"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50"
                  onClick={() => window.location.reload()}
                >
                  {t('profileReloadButton')}
                </button>
              )}
            </div>
          </div>

          <SettingsGroupTitle separated>
            {t('dangerZoneSettingsGroup')}
          </SettingsGroupTitle>
          <div className="space-y-3 py-3 text-left">
            <p className="text-xs leading-4 text-gray-500">
              {t('dangerZoneDescription')}
            </p>
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={handleResetCosmetics}
            >
              {t('resetCosmeticsToDefault')}
            </button>
            {resetCosmeticsMessage && (
              <div className="text-xs font-medium text-green-500">
                {resetCosmeticsMessage}
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={handleResetSettings}
            >
              {t('resetSettingsToDefault')}
            </button>
            {resetSettingsMessage && (
              <div className="text-xs font-medium text-green-500">
                {resetSettingsMessage}
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => setIsFormatConfirmOpen(true)}
            >
              {t('formatProfileButton')}
            </button>
          </div>
        </div>
      </BaseModal>
      {languagePicker}
      <BaseModal
        title={t('formatConfirmTitle')}
        isOpen={isFormatConfirmOpen}
        handleClose={() => setIsFormatConfirmOpen(false)}
      >
        <div className="space-y-4 text-left">
          <p className="text-sm leading-5 text-gray-600">
            {t('formatConfirmDescription')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={() => setIsFormatConfirmOpen(false)}
            >
              {t('formatConfirmCancel')}
            </button>
            <button
              type="button"
              className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              onClick={handleFormatProfile}
            >
              {t('formatConfirmConfirm')}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  )
}

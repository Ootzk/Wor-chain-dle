import { useState, useEffect } from 'react'
import { BaseModal } from './BaseModal'
import { CogIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../constants/config'
import { localeLanguageKey } from '../../i18n'
import {
  COSMETIC_OPTIONS,
  getShareEmojiSet,
  equipCosmetic,
  loadCosmeticState,
} from '../../lib/cosmetics'
import { loadAchievementState } from '../../lib/achievements'

const langFlags: Record<string, string> = {
  en: '\uD83C\uDDFA\uD83C\uDDF8\uD83C\uDDEC\uD83C\uDDE7',
  ko: '\uD83C\uDDF0\uD83C\uDDF7',
  ja: '\uD83C\uDDEF\uD83C\uDDF5',
  es: '\uD83C\uDDEA\uD83C\uDDF8',
  sw: '\uD83C\uDDF9\uD83C\uDDFF\uD83C\uDDF0\uD83C\uDDEA',
  zh: '\uD83C\uDDE8\uD83C\uDDF3',
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
  const [activeTab, setActiveTab] = useState<'preferences' | 'cosmetics'>(
    'preferences'
  )
  const [equippedEmoji, setEquippedEmoji] = useState(
    () => loadCosmeticState().equipped.shareEmoji
  )

  useEffect(() => {
    if (isOpen) setActiveTab('preferences')
  }, [isOpen])

  const achievementState = loadAchievementState()
  const shareEmojiOptions = COSMETIC_OPTIONS.filter(
    (o) => o.category === 'shareEmoji'
  )

  const isOptionUnlocked = (option: (typeof COSMETIC_OPTIONS)[number]) =>
    !option.requiresAchievement ||
    !!achievementState.unlocked[option.requiresAchievement]

  const tabs = [
    { id: 'preferences' as const, label: t('preferences') },
    { id: 'cosmetics' as const, label: t('cosmetics') },
  ]

  return (
    <BaseModal
      title={t('settings')}
      icon={<CogIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'preferences' && (
        <div>
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
            <Toggle
              checked={weekStartsOnMonday}
              onClick={onToggleWeekStart}
            />
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
      )}

      {activeTab === 'cosmetics' && (
        <div>
          <div className="py-3">
            <span className="text-sm font-medium text-gray-700">
              {t('shareEmojiLabel')}
            </span>
            <div className="mt-2 space-y-2">
              {shareEmojiOptions.map((option) => {
                const unlocked = isOptionUnlocked(option)
                const selected = equippedEmoji === option.id
                const emojiSet = getShareEmojiSet(option.id)
                return (
                  <button
                    key={option.id}
                    disabled={!unlocked}
                    className={`w-full flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50'
                        : unlocked
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (unlocked) {
                        equipCosmetic('shareEmoji', option.id)
                        setEquippedEmoji(option.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {emojiSet.correct}
                        {emojiSet.present}
                        {emojiSet.absent}
                      </span>
                      <span
                        className={
                          unlocked ? 'text-gray-900' : 'text-gray-400'
                        }
                      >
                        {t(option.titleKey)}
                      </span>
                    </div>
                    {selected && (
                      <span className="text-indigo-600 text-xs font-medium">
                        {t('equipped')}
                      </span>
                    )}
                    {!unlocked && (
                      <span className="text-gray-400 text-xs">
                        {'\uD83D\uDD12'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  )
}

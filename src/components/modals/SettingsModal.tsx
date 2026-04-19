import { useState, useEffect } from 'react'
import { BaseModal } from './BaseModal'
import { CogIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../constants/config'
import { localeLanguageKey } from '../../i18n'
import { CompletedRow } from '../grid/CompletedRow'
import { ChainBridge } from '../grid/ChainBridge'
import { generateShareText } from '../../lib/share'
import { Temporal } from 'temporal-polyfill'
import {
  COSMETIC_OPTIONS,
  CosmeticCategory,
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
  const [equipped, setEquipped] = useState(() => loadCosmeticState().equipped)

  useEffect(() => {
    if (isOpen) setActiveTab('preferences')
  }, [isOpen])

  // Sample: ocean → chain (solution = chain)
  const sampleSolution = 'chain'
  const sampleGuesses = [
    ['o', 'c', 'e', 'a', 'n'],
    ['c', 'h', 'a', 'i', 'n'],
  ]

  const achievementState = loadAchievementState()

  const cosmeticCategories: {
    category: CosmeticCategory
    labelKey: string
  }[] = [
    { category: 'shareEmoji', labelKey: 'shareEmojiLabel' },
    { category: 'cellFont', labelKey: 'cellFontLabel' },
    { category: 'cellColor', labelKey: 'cellColorLabel' },
    { category: 'chainStyle', labelKey: 'chainStyleLabel' },
    { category: 'endMessage', labelKey: 'endMessageLabel' },
  ]

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
          {/* Sample grid: ocean → chain */}
          <div className={`flex flex-col items-center py-2 ${isUppercase ? 'uppercase' : ''}`}>
            <CompletedRow
              guess={sampleGuesses[0]}
              solution={sampleSolution}
              chainBottomIndex={4}
            />
            <ChainBridge chainIndex={4} />
            <CompletedRow
              guess={sampleGuesses[1]}
              solution={sampleSolution}
              chainTopIndex={4}
            />
          </div>

          {/* Share preview */}
          <div className="mt-2">
            <pre className="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700 whitespace-pre leading-relaxed">
              {generateShareText(
                sampleGuesses,
                false,
                sampleSolution,
                CONFIG.tries,
                Temporal.Now.plainDateISO().toString(),
                excludeUrl
              )}
            </pre>
          </div>

          {/* Cosmetic dropdowns */}
          {cosmeticCategories.map(({ category, labelKey }) => {
            const options = COSMETIC_OPTIONS.filter(
              (o) => o.category === category
            )
            return (
              <div
                key={category}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm font-medium text-gray-700">
                  {t(labelKey)}
                </span>
                <select
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={equipped[category]}
                  onChange={(e) => {
                    equipCosmetic(category, e.target.value)
                    setEquipped({ ...equipped, [category]: e.target.value })
                  }}
                >
                  {options.map((option) => {
                    const unlocked = isOptionUnlocked(option)
                    const preview =
                      category === 'shareEmoji'
                        ? (() => {
                            const s = getShareEmojiSet(option.id)
                            return `${s.correct}${s.present}${s.absent} `
                          })()
                        : ''
                    return (
                      <option
                        key={option.id}
                        value={option.id}
                        disabled={!unlocked}
                      >
                        {preview}
                        {t(option.titleKey)}
                        {!unlocked ? ' \uD83D\uDD12' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </BaseModal>
  )
}

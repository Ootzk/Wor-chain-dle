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
  CELL_FONT_STYLES,
  CELL_COLOR_STYLES,
  ALERT_MESSAGE_KEYS,
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

const CosmeticPicker = ({
  category,
  options,
  equipped,
  onSelect,
  isUnlocked,
  t,
  labelKey,
}: {
  category: CosmeticCategory
  options: typeof COSMETIC_OPTIONS
  equipped: string
  onSelect: (id: string) => void
  isUnlocked: (option: (typeof COSMETIC_OPTIONS)[number]) => boolean
  t: (key: string, opts?: any) => any
  labelKey: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [msgIndex, setMsgIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.id === equipped))
  )

  const renderPreview = (optionId: string, compact = false) => {
    switch (category) {
      case 'shareEmoji': {
        const s = getShareEmojiSet(optionId)
        return <span>{s.correct}{s.present}{s.absent}</span>
      }
      case 'cellFont': {
        const fontClass = CELL_FONT_STYLES[optionId] || ''
        return <span className={`${fontClass} font-bold`}>ABC</span>
      }
      case 'cellColor': {
        const colorClass = CELL_COLOR_STYLES[optionId] || ''
        return (
          <span className={`inline-block w-5 h-5 rounded ${colorClass || 'text-white'} bg-green-500 text-center text-xs leading-5 font-bold`}>
            A
          </span>
        )
      }
      case 'chainStyle': {
        const borderStyle = optionId === 'chain_dashed' ? 'border-dashed' : 'border-solid'
        const borderWidth = optionId === 'chain_thick' ? 'border-t-4' : 'border-t-2'
        return (
          <span className={`inline-block w-8 ${borderWidth} ${borderStyle} border-black`} />
        )
      }
      case 'endMessage': {
        if (compact) return null
        const keys = ALERT_MESSAGE_KEYS[optionId]
        const msgs = t(keys?.win || 'winMessages_classic', { returnObjects: true })
        const loss = t(keys?.loss || 'lossMessage_classic', { solution: '?' })
        if (!Array.isArray(msgs)) return null
        return (
          <div className="text-xs text-gray-500 space-y-0.5">
            {msgs.map((msg: string, i: number) => (
              <div key={i}>
                <span className="text-gray-400">{i + 1}.</span> {msg}
              </div>
            ))}
            <div>
              <span className="text-gray-400">X.</span> {loss}
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  const equippedOption = options.find((o) => o.id === equipped)

  return (
    <>
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-medium text-gray-700">
          {t(labelKey)}
        </span>
        <button
          type="button"
          className="w-36 flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <span className="flex items-center justify-between w-full">
            <span>{renderPreview(equipped, true)}</span>
            <span className="flex items-center gap-1">
              <span className="truncate">{equippedOption ? t(equippedOption.titleKey) : ''}</span>
              <span className="text-xs text-gray-400">{'\u25BC'}</span>
            </span>
          </span>
        </button>
      </div>

      {isOpen && category !== 'endMessage' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-72 max-h-80 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-900">
                {t(labelKey)}
              </span>
            </div>
            {options.map((option) => {
              const unlocked = isUnlocked(option)
              const selected = equipped === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!unlocked}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-gray-50 ${
                    selected
                      ? 'bg-indigo-50 text-indigo-600'
                      : unlocked
                        ? 'hover:bg-gray-50 text-gray-700'
                        : 'text-gray-300 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (unlocked) {
                      onSelect(option.id)
                      setIsOpen(false)
                    }
                  }}
                >
                  <span className="flex-shrink-0">{renderPreview(option.id)}</span>
                  <span className="flex-1 text-right">{t(option.titleKey)}</span>
                  <span className="w-5 text-center flex-shrink-0">
                    {!unlocked && '\uD83D\uDD12'}
                    {selected && unlocked && <span className="text-indigo-600">{'\u2713'}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isOpen && category === 'endMessage' && (() => {
        const currentOption = options[msgIndex]
        const unlocked = isUnlocked(currentOption)
        const selected = equipped === currentOption.id
        const keys = ALERT_MESSAGE_KEYS[currentOption.id]
        const msgs = t(keys?.win || 'winMessages_classic', { returnObjects: true })
        const loss = t(keys?.loss || 'lossMessage_classic', { solution: '?' })

        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-72"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-bold text-gray-900">
                  {t(labelKey)}
                </span>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2"
                  onClick={() => setMsgIndex((msgIndex - 1 + options.length) % options.length)}
                >
                  {'<'}
                </button>
                <span className="text-sm font-semibold text-gray-900">
                  {t(currentOption.titleKey)}
                </span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2"
                  onClick={() => setMsgIndex((msgIndex + 1) % options.length)}
                >
                  {'>'}
                </button>
              </div>

              <div className="px-4 pb-3">
                {Array.isArray(msgs) && (
                  <table className="w-full text-sm text-gray-600">
                    <tbody>
                      {msgs.map((msg: string, i: number) => (
                        <tr key={i}>
                          <td className="text-gray-400 pr-2 py-0.5 w-6 text-right">{i + 1}.</td>
                          <td className="py-0.5">{msg}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="text-gray-400 pr-2 py-0.5 w-6 text-right">X.</td>
                        <td className="py-0.5">{loss}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-4 pb-3">
                {!unlocked && (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                  >
                    {'\uD83D\uDD12'}
                  </button>
                )}
                {unlocked && selected && (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-500 cursor-default"
                  >
                    {'\u2713'}
                  </button>
                )}
                {unlocked && !selected && (
                  <button
                    type="button"
                    className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    onClick={() => {
                      onSelect(currentOption.id)
                      setIsOpen(false)
                    }}
                  >
                    {t('equip')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

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
          {/* Win message preview (Alert style) */}
          {(() => {
            const keys = ALERT_MESSAGE_KEYS[equipped.endMessage]
            const msgs = t(keys?.win || 'winMessages_classic', { returnObjects: true })
            const msg = Array.isArray(msgs) ? msgs[sampleGuesses.length - 1] : ''
            return (
              <div className="bg-green-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div className="p-4">
                  <p className="text-sm text-center font-medium text-gray-900">
                    {msg}
                  </p>
                </div>
              </div>
            )
          })()}

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

          {/* Cosmetic pickers */}
          {cosmeticCategories.map(({ category, labelKey }) => {
            const options = COSMETIC_OPTIONS.filter(
              (o) => o.category === category
            )
            return (
              <CosmeticPicker
                key={category}
                category={category}
                options={options}
                equipped={equipped[category]}
                onSelect={(id) => {
                  equipCosmetic(category, id)
                  setEquipped({ ...equipped, [category]: id })
                }}
                isUnlocked={isOptionUnlocked}
                t={t}
                labelKey={labelKey}
              />
            )
          })}
        </div>
      )}
    </BaseModal>
  )
}

import { useState } from 'react'
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
  equipCosmetic,
  loadCosmeticState,
  ALERT_MESSAGE_KEYS,
  MSG_THEME_EMOJI,
} from '../../lib/cosmetics'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'
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

  const renderPreview = (optionId: string, compact = false) => (
    <CosmeticPreview category={category} optionId={optionId} compact={compact} />
  )

  const equippedOption = options.find((o) => o.id === equipped)

  return (
    <>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm font-medium text-gray-700">
          {t(labelKey)}
        </span>
        <button
          type="button"
          className="w-36 flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <span className="flex items-center justify-between w-full">
            <span className="flex items-center">{renderPreview(equipped, true)}</span>
            <span className="flex items-center gap-1">
              <span className="truncate">{equippedOption ? t(equippedOption.titleKey) : ''}</span>
              <span className="text-xs text-gray-400">{'\u25BE'}</span>
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
                  <span className="flex-shrink-0 flex items-center">{renderPreview(option.id)}</span>
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

              <div className={`flex items-center justify-between px-4 py-3 ${selected ? 'bg-indigo-50' : ''}`}>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2"
                  onClick={() => setMsgIndex((msgIndex - 1 + options.length) % options.length)}
                >
                  {'<'}
                </button>
                <span className={`text-sm font-semibold ${selected ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {MSG_THEME_EMOJI[currentOption.id] || ''} {t(currentOption.titleKey)}
                </span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2"
                  onClick={() => setMsgIndex((msgIndex + 1) % options.length)}
                >
                  {'>'}
                </button>
              </div>

              <div className={`px-4 pb-3 ${selected ? 'bg-indigo-50' : ''}`}>
                {Array.isArray(msgs) && (
                  <table className={`w-full text-sm ${selected ? 'text-indigo-600' : 'text-gray-600'}`}>
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

              <div className={`px-4 pb-3 ${selected ? 'bg-indigo-50' : ''}`}>
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
                    className="w-full rounded-md bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-600 cursor-default"
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
  excludeUrl,
  onToggleExcludeUrl,
}: Props) => {
  const { t, i18n } = useTranslation()
  const [equipped, setEquipped] = useState(() => loadCosmeticState().equipped)
  const [isLangOpen, setIsLangOpen] = useState(false)

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
    { category: 'chainColor', labelKey: 'chainColorLabel' },
    { category: 'endMessage', labelKey: 'endMessageLabel' },
  ]

  const isOptionUnlocked = (option: (typeof COSMETIC_OPTIONS)[number]) =>
    !option.requiresAchievement ||
    !!achievementState.unlocked[option.requiresAchievement]

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
                  className="bg-white rounded-lg shadow-xl w-72 max-h-80 overflow-y-auto"
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
                          {selected && <span className="text-indigo-600">{'\u2713'}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Sample view */}
        <div className="my-2">
          {/* Win message preview */}
          {(() => {
            const keys = ALERT_MESSAGE_KEYS[equipped.endMessage]
            const msgs = t(keys?.win || 'winMessages_classic', { returnObjects: true })
            const msg = Array.isArray(msgs) ? msgs[sampleGuesses.length - 1] : ''
            return (
              <div className="bg-green-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div className="p-3">
                  <p className="text-sm text-center font-medium text-gray-900">
                    {msg}
                  </p>
                </div>
              </div>
            )
          })()}

          {/* Sample grid */}
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

        {/* Display settings */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('uppercaseLabel')}
          </span>
          <Toggle checked={isUppercase} onClick={onToggleUppercase} />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('excludeUrlLabel')}
          </span>
          <Toggle checked={excludeUrl} onClick={onToggleExcludeUrl} />
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
    </BaseModal>
  )
}

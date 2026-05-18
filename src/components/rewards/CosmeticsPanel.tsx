import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Temporal } from 'temporal-polyfill'
import { CONFIG } from '../../constants/config'
import {
  ALERT_MESSAGE_KEYS,
  COSMETIC_OPTIONS,
  CosmeticCategory,
  equipCosmetic,
  loadCosmeticState,
  MSG_THEME_EMOJI,
} from '../../lib/cosmetics'
import { loadAchievementState } from '../../lib/achievements'
import { generateShareText } from '../../lib/share'
import { getRewardMetadataLabel } from '../../lib/rewardMetadata'
import { ChainBridge } from '../grid/ChainBridge'
import { CompletedRow } from '../grid/CompletedRow'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'

type CosmeticOption = typeof COSMETIC_OPTIONS[number]

const cosmeticCategories: {
  category: CosmeticCategory
  labelKey: string
}[] = [
  { category: 'shareBadge', labelKey: 'shareBadgeLabel' },
  { category: 'shareEmoji', labelKey: 'shareEmojiLabel' },
  { category: 'cellFont', labelKey: 'cellFontLabel' },
  { category: 'cellColor', labelKey: 'cellColorLabel' },
  { category: 'chainStyle', labelKey: 'chainStyleLabel' },
  { category: 'chainColor', labelKey: 'chainColorLabel' },
  { category: 'endMessage', labelKey: 'endMessageLabel' },
]

const CosmeticPicker = ({
  category,
  options,
  equipped,
  onSelect,
  isUnlocked,
  labelKey,
  onNavigateToAchievement,
}: {
  category: CosmeticCategory
  options: typeof COSMETIC_OPTIONS
  equipped: string
  onSelect: (id: string) => void
  isUnlocked: (option: CosmeticOption) => boolean
  labelKey: string
  onNavigateToAchievement?: (achievementId: string) => void
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [msgIndex, setMsgIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.id === equipped)
    )
  )

  const renderPreview = (optionId: string, compact = false) => (
    <CosmeticPreview
      category={category}
      optionId={optionId}
      compact={compact}
    />
  )

  const equippedOption = options.find((o) => o.id === equipped)
  const getOptionMetadataLabel = (option: CosmeticOption) =>
    getRewardMetadataLabel(option.metadata)

  return (
    <>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm font-medium text-gray-700">{t(labelKey)}</span>
        <button
          type="button"
          className="w-36 flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <span className="flex items-center justify-between w-full">
            <span className="flex items-center">
              {renderPreview(equipped, true)}
            </span>
            <span className="flex items-center gap-1">
              <span className="truncate">
                {equippedOption ? t(equippedOption.titleKey) : ''}
              </span>
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
                <div
                  key={option.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-gray-50 cursor-pointer ${
                    selected
                      ? 'bg-indigo-50 text-indigo-600'
                      : unlocked
                      ? 'hover:bg-gray-50 text-gray-700'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (unlocked) {
                      onSelect(option.id)
                      setIsOpen(false)
                    } else if (
                      onNavigateToAchievement &&
                      option.requiresAchievement
                    ) {
                      setIsOpen(false)
                      onNavigateToAchievement(option.requiresAchievement)
                    }
                  }}
                >
                  <span className="flex-shrink-0 flex items-center">
                    {renderPreview(option.id)}
                  </span>
                  <span className="flex-1 text-right min-w-0">
                    <span className="block truncate">{t(option.titleKey)}</span>
                    {getOptionMetadataLabel(option) && (
                      <span className="block text-[0.625rem] leading-tight text-gray-400">
                        {getOptionMetadataLabel(option)}
                      </span>
                    )}
                  </span>
                  <span className="w-5 text-center flex-shrink-0">
                    {!unlocked && '\uD83D\uDD12'}
                    {selected && unlocked && (
                      <span className="text-indigo-600">{'\u2713'}</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isOpen &&
        category === 'endMessage' &&
        (() => {
          const currentOption = options[msgIndex]
          const unlocked = isUnlocked(currentOption)
          const selected = equipped === currentOption.id
          const keys = ALERT_MESSAGE_KEYS[currentOption.id]
          const msgs = t(keys?.win || 'winMessages_classic', {
            returnObjects: true,
          })
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

                <div
                  className={`flex items-center justify-between px-4 py-3 ${
                    selected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2"
                    onClick={() =>
                      setMsgIndex(
                        (msgIndex - 1 + options.length) % options.length
                      )
                    }
                  >
                    {'<'}
                  </button>
                  <span className="min-w-0 text-center">
                    <span
                      className={`block truncate text-sm font-semibold ${
                        selected ? 'text-indigo-600' : 'text-gray-900'
                      }`}
                    >
                      {MSG_THEME_EMOJI[currentOption.id] || ''}{' '}
                      {t(currentOption.titleKey)}
                    </span>
                    {getOptionMetadataLabel(currentOption) && (
                      <span className="block text-[0.625rem] leading-tight text-gray-400">
                        {getOptionMetadataLabel(currentOption)}
                      </span>
                    )}
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
                    <table
                      className={`w-full text-sm ${
                        selected ? 'text-indigo-600' : 'text-gray-600'
                      }`}
                    >
                      <tbody>
                        {msgs.map((msg: string, i: number) => (
                          <tr key={i}>
                            <td className="text-gray-400 pr-2 py-0.5 w-6 text-right">
                              {i + 1}.
                            </td>
                            <td className="py-0.5">{msg}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="text-gray-400 pr-2 py-0.5 w-6 text-right">
                            X.
                          </td>
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
                      className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-400 cursor-pointer hover:bg-gray-300"
                      onClick={() => {
                        if (
                          onNavigateToAchievement &&
                          currentOption.requiresAchievement
                        ) {
                          setIsOpen(false)
                          onNavigateToAchievement(
                            currentOption.requiresAchievement
                          )
                        }
                      }}
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

export const CosmeticsPanel = ({
  isUppercase,
  excludeUrl,
  onNavigateToAchievement,
}: {
  isUppercase: boolean
  excludeUrl: boolean
  onNavigateToAchievement?: (achievementId: string) => void
}) => {
  const { t } = useTranslation()
  const [equipped, setEquipped] = useState(() => loadCosmeticState().equipped)
  const achievementState = loadAchievementState()

  const sampleSolution = 'chain'
  const sampleGuesses = [
    ['o', 'c', 'e', 'a', 'n'],
    ['c', 'h', 'a', 'i', 'n'],
  ]

  const isOptionUnlocked = (option: CosmeticOption) =>
    !option.requiresAchievement ||
    !!achievementState.unlocked[option.requiresAchievement]

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="my-2">
        {(() => {
          const keys = ALERT_MESSAGE_KEYS[equipped.endMessage]
          const msgs = t(keys?.win || 'winMessages_classic', {
            returnObjects: true,
          })
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

        <div
          className={`flex flex-col items-center py-2 ${
            isUppercase ? 'uppercase' : ''
          }`}
        >
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

      {cosmeticCategories.map(({ category, labelKey }) => {
        const options = COSMETIC_OPTIONS.filter((o) => o.category === category)
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
            labelKey={labelKey}
            onNavigateToAchievement={onNavigateToAchievement}
          />
        )
      })}
    </div>
  )
}

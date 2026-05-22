import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Temporal } from 'temporal-polyfill'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  StarIcon as StarOutlineIcon,
} from '@heroicons/react/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/solid'
import { CONFIG } from '../../constants/config'
import {
  ALERT_MESSAGE_KEYS,
  COSMETIC_OPTIONS,
  CosmeticCategory,
  equipCosmetic,
  loadCosmeticState,
  MSG_THEME_EMOJI,
} from '../../lib/cosmetics'
import {
  ACHIEVEMENTS,
  getAchievementModes,
  loadAchievementState,
} from '../../lib/achievements'
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

type SortFilterKey =
  | 'priority'
  | 'status'
  | 'version'
  | 'achievementType'
  | 'cosmeticCategory'
  | 'gameMode'
type PriorityFilterValue = 'new' | 'favorite' | 'normal'
type StatusFilterValue = 'equipped' | 'unlocked' | 'locked'

const DEFAULT_SORT_FILTER_ORDER: SortFilterKey[] = [
  'priority',
  'status',
  'version',
  'achievementType',
  'cosmeticCategory',
  'gameMode',
]
const PRIORITY_FILTER_OPTIONS: PriorityFilterValue[] = [
  'new',
  'favorite',
  'normal',
]
const STATUS_FILTER_OPTIONS: StatusFilterValue[] = [
  'equipped',
  'unlocked',
  'locked',
]
const FILTER_PREFERENCES_STORAGE_KEY = 'achievementFilterPreferences:v1.7.0'
const FAVORITES_STORAGE_KEY = 'achievementFavoriteIds'

const achievementById = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement] as const)
)

const DEFAULT_REWARD_MODES = ['daily', 'practice', 'custom', 'event']

const getCosmeticFavoriteId = (option: CosmeticOption): string =>
  option.requiresAchievement ?? `default_${option.id}`

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []

const normalizeSortFilterKey = (value: unknown): SortFilterKey | undefined => {
  return DEFAULT_SORT_FILTER_ORDER.includes(value as SortFilterKey)
    ? (value as SortFilterKey)
    : undefined
}

const normalizeFilterOrder = (value: unknown): SortFilterKey[] => {
  const seen = new Set<SortFilterKey>()
  const storedOrder: SortFilterKey[] = []
  if (Array.isArray(value)) {
    value.forEach((item) => {
      const filterKey = normalizeSortFilterKey(item)
      if (!filterKey || seen.has(filterKey)) return
      seen.add(filterKey)
      storedOrder.push(filterKey)
    })
  }

  return [
    ...storedOrder,
    ...DEFAULT_SORT_FILTER_ORDER.filter((filterKey) => !seen.has(filterKey)),
  ]
}

const normalizeOptionOrders = (
  value: unknown
): Record<SortFilterKey, string[]> => {
  const optionOrders: Record<SortFilterKey, string[]> = {
    priority: [],
    status: [],
    version: [],
    achievementType: [],
    cosmeticCategory: [],
    gameMode: [],
  }
  if (!value || typeof value !== 'object') return optionOrders

  DEFAULT_SORT_FILTER_ORDER.forEach((filterKey) => {
    const storedOrder = (value as Partial<Record<SortFilterKey, unknown>>)[
      filterKey
    ]
    optionOrders[filterKey] = normalizeStringArray(storedOrder)
  })

  return optionOrders
}

const loadCosmeticSortPreferences = (): {
  filterOrder: SortFilterKey[]
  optionOrders: Record<SortFilterKey, string[]>
} => {
  try {
    const raw = localStorage.getItem(FILTER_PREFERENCES_STORAGE_KEY)
    if (!raw) {
      return {
        filterOrder: DEFAULT_SORT_FILTER_ORDER,
        optionOrders: normalizeOptionOrders(undefined),
      }
    }

    const parsed = JSON.parse(raw) as {
      filterOrder?: unknown
      optionOrders?: unknown
    }
    return {
      filterOrder: normalizeFilterOrder(parsed.filterOrder),
      optionOrders: normalizeOptionOrders(parsed.optionOrders),
    }
  } catch {
    return {
      filterOrder: DEFAULT_SORT_FILTER_ORDER,
      optionOrders: normalizeOptionOrders(undefined),
    }
  }
}

const loadAchievementFavoriteIds = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []
    return normalizeStringArray(JSON.parse(raw))
  } catch {
    return []
  }
}

const saveAchievementFavoriteIds = (achievementIds: string[]) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(achievementIds))
  } catch {
    // Favorites are convenience-only; ignore storage failures.
  }
}

const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

const mergeOrder = (availableValues: string[], storedOrder: string[]) => [
  ...storedOrder.filter((value) => availableValues.includes(value)),
  ...availableValues.filter((value) => !storedOrder.includes(value)),
]

const getSortValues = (
  option: CosmeticOption,
  filterKey: SortFilterKey
): string[] => {
  const achievement = option.requiresAchievement
    ? achievementById.get(option.requiresAchievement)
    : undefined

  if (filterKey === 'version') {
    return option.metadata?.introducedInVersion
      ? [option.metadata.introducedInVersion]
      : achievement?.metadata?.introducedInVersion
      ? [achievement.metadata.introducedInVersion]
      : []
  }
  if (filterKey === 'achievementType') {
    return achievement ? [achievement.achievementType] : ['default']
  }
  if (filterKey === 'cosmeticCategory') {
    return [option.category]
  }
  return achievement ? getAchievementModes(achievement) : DEFAULT_REWARD_MODES
}

const getCosmeticStatus = (
  option: CosmeticOption,
  achievementState: ReturnType<typeof loadAchievementState>,
  equippedOptionId: string
): StatusFilterValue =>
  option.id === equippedOptionId
    ? 'equipped'
    : !option.requiresAchievement ||
      !!achievementState.unlocked[option.requiresAchievement]
    ? 'unlocked'
    : 'locked'

const getAchievementNewState = (
  option: CosmeticOption,
  achievementState: ReturnType<typeof loadAchievementState>
): boolean => {
  if (!option.requiresAchievement) return false
  const unlocked = achievementState.unlocked[option.requiresAchievement]
  return !!unlocked && unlocked.unlockedAt > (achievementState.lastSeenAt || 0)
}

const getAchievementFavoriteState = (
  option: CosmeticOption,
  favoriteIds: Set<string>
): boolean => favoriteIds.has(getCosmeticFavoriteId(option))

const getCosmeticPriority = (
  option: CosmeticOption,
  achievementState: ReturnType<typeof loadAchievementState>,
  favoriteIds: Set<string>
): PriorityFilterValue => {
  if (getAchievementNewState(option, achievementState)) return 'new'
  if (getAchievementFavoriteState(option, favoriteIds)) return 'favorite'
  return 'normal'
}

const sortCosmeticOptions = (
  options: typeof COSMETIC_OPTIONS,
  achievementState: ReturnType<typeof loadAchievementState>,
  favoriteIds: Set<string>,
  equippedOptionId: string
): typeof COSMETIC_OPTIONS => {
  const { filterOrder, optionOrders } = loadCosmeticSortPreferences()
  const sourceIndexById = new Map(
    options.map((option, index) => [option.id, index] as const)
  )
  const orders = Object.fromEntries(
    DEFAULT_SORT_FILTER_ORDER.map((filterKey) => {
      const availableValues =
        filterKey === 'priority'
          ? PRIORITY_FILTER_OPTIONS
          : filterKey === 'status'
          ? STATUS_FILTER_OPTIONS
          : uniqueSorted(
              options.flatMap((option) => getSortValues(option, filterKey))
            )
      return [
        filterKey,
        mergeOrder(
          availableValues,
          filterKey === 'status' && !optionOrders.status.includes('equipped')
            ? ['equipped', ...optionOrders.status]
            : optionOrders[filterKey] ?? []
        ),
      ]
    })
  ) as Record<SortFilterKey, string[]>

  const getRank = (option: CosmeticOption, filterKey: SortFilterKey) => {
    if (filterKey === 'priority') {
      const rank = orders.priority.indexOf(
        getCosmeticPriority(option, achievementState, favoriteIds)
      )
      return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
    }

    if (filterKey === 'status') {
      const rank = orders.status.indexOf(
        getCosmeticStatus(option, achievementState, equippedOptionId)
      )
      return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
    }

    const ranks = getSortValues(option, filterKey).map((value) => {
      const rank = orders[filterKey].indexOf(value)
      return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
    })
    return ranks.length > 0 ? Math.min(...ranks) : Number.MAX_SAFE_INTEGER
  }
  return [...options].sort((a, b) => {
    for (const filterKey of filterOrder) {
      const rankDiff = getRank(a, filterKey) - getRank(b, filterKey)
      if (rankDiff !== 0) return rankDiff
    }

    return (sourceIndexById.get(a.id) ?? 0) - (sourceIndexById.get(b.id) ?? 0)
  })
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

const CosmeticSettingRow = ({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2.5 last:border-b-0">
    <div className="min-w-0 text-left">
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className="mt-1 text-xs leading-4 text-gray-500">{description}</div>
    </div>
    <div className="flex-shrink-0">
      <Toggle checked={checked} onClick={onToggle} />
    </div>
  </div>
)

const CosmeticFavoriteButton = ({
  option,
  active,
  onToggle,
}: {
  option: CosmeticOption
  active: boolean
  onToggle: (favoriteId: string) => void
}) => {
  const { t } = useTranslation()
  const label = active
    ? t('achievementFavoriteRemove')
    : t('achievementFavoriteAdd')
  const Icon = active ? StarSolidIcon : StarOutlineIcon

  return (
    <button
      type="button"
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center transition-colors ${
        active ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
      }`}
      onClick={(event) => {
        event.stopPropagation()
        onToggle(getCosmeticFavoriteId(option))
      }}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

const CosmeticPicker = ({
  category,
  options,
  equipped,
  onSelect,
  isUnlocked,
  labelKey,
  onNavigateToAchievement,
  achievementState,
}: {
  category: CosmeticCategory
  options: typeof COSMETIC_OPTIONS
  equipped: string
  onSelect: (id: string) => void
  isUnlocked: (option: CosmeticOption) => boolean
  labelKey: string
  onNavigateToAchievement?: (achievementId: string) => void
  achievementState: ReturnType<typeof loadAchievementState>
}) => {
  const { t } = useTranslation()
  const [favoriteIds, setFavoriteIds] = useState(loadAchievementFavoriteIds)
  const favoriteIdSet = new Set(favoriteIds)
  const sortedOptions = sortCosmeticOptions(
    options,
    achievementState,
    favoriteIdSet,
    equipped
  )
  const [isOpen, setIsOpen] = useState(false)
  const [msgIndex, setMsgIndex] = useState(() =>
    Math.max(
      0,
      sortedOptions.findIndex((o) => o.id === equipped)
    )
  )

  const renderPreview = (optionId: string, compact = false) => (
    <CosmeticPreview
      category={category}
      optionId={optionId}
      compact={compact}
    />
  )

  const equippedOption = sortedOptions.find((o) => o.id === equipped)
  const equippedIsFavorite = equippedOption
    ? getAchievementFavoriteState(equippedOption, favoriteIdSet)
    : false
  const getOptionMetadataLabel = (option: CosmeticOption) =>
    getRewardMetadataLabel(option.metadata)
  const toggleFavorite = (achievementId: string) => {
    setFavoriteIds((currentIds) => {
      const nextIds = currentIds.includes(achievementId)
        ? currentIds.filter((id) => id !== achievementId)
        : [...currentIds, achievementId]
      saveAchievementFavoriteIds(nextIds)
      return nextIds
    })
  }

  return (
    <>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm font-medium text-gray-700">{t(labelKey)}</span>
        <button
          type="button"
          className="w-48 flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <span className="flex items-center justify-between w-full">
            <span className="flex items-center">
              {renderPreview(equipped, true)}
            </span>
            <span className="flex items-center gap-1">
              {equippedIsFavorite && (
                <StarSolidIcon className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
              )}
              <span className="truncate">
                {equippedOption ? t(equippedOption.titleKey) : ''}
              </span>
              <ChevronDownIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
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
            {sortedOptions.map((option) => {
              const unlocked = isUnlocked(option)
              const selected = equipped === option.id
              const isNew = getAchievementNewState(option, achievementState)
              const isFavorite = getAchievementFavoriteState(
                option,
                favoriteIdSet
              )
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
                    <span className="flex min-w-0 items-center justify-end gap-1">
                      {isNew && (
                        <span className="text-[0.625rem] font-bold text-yellow-600 bg-yellow-100 rounded px-1 py-0.5 flex-shrink-0">
                          NEW!
                        </span>
                      )}
                      <span className="truncate">{t(option.titleKey)}</span>
                    </span>
                    {getOptionMetadataLabel(option) && (
                      <span className="block text-[0.625rem] leading-tight text-gray-400">
                        {getOptionMetadataLabel(option)}
                      </span>
                    )}
                  </span>
                  <CosmeticFavoriteButton
                    option={option}
                    active={isFavorite}
                    onToggle={toggleFavorite}
                  />
                  <span className="w-5 text-center flex-shrink-0">
                    {!unlocked && (
                      <LockClosedIcon className="mx-auto h-5 w-5" />
                    )}
                    {selected && unlocked && (
                      <CheckIcon className="mx-auto h-5 w-5 text-indigo-600" />
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
          const currentOption = sortedOptions[msgIndex]
          const unlocked = isUnlocked(currentOption)
          const selected = equipped === currentOption.id
          const isNew = getAchievementNewState(currentOption, achievementState)
          const isFavorite = getAchievementFavoriteState(
            currentOption,
            favoriteIdSet
          )
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
                        (msgIndex - 1 + sortedOptions.length) %
                          sortedOptions.length
                      )
                    }
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="min-w-0 text-center">
                    <span className="flex min-w-0 items-center justify-center gap-1">
                      {isNew && (
                        <span className="text-[0.625rem] font-bold text-yellow-600 bg-yellow-100 rounded px-1 py-0.5 flex-shrink-0">
                          NEW!
                        </span>
                      )}
                      <span
                        className={`block truncate text-sm font-semibold ${
                          selected ? 'text-indigo-600' : 'text-gray-900'
                        }`}
                      >
                        {MSG_THEME_EMOJI[currentOption.id] || ''}{' '}
                        {t(currentOption.titleKey)}
                      </span>
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
                    onClick={() =>
                      setMsgIndex((msgIndex + 1) % sortedOptions.length)
                    }
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <div
                  className={`flex justify-end px-4 pb-2 ${
                    selected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <CosmeticFavoriteButton
                    option={currentOption}
                    active={isFavorite}
                    onToggle={toggleFavorite}
                  />
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
                      <LockClosedIcon className="mx-auto h-5 w-5" />
                    </button>
                  )}
                  {unlocked && selected && (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-md bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-600 cursor-default"
                    >
                      <CheckIcon className="mx-auto h-5 w-5" />
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
  onToggleUppercase,
  excludeUrl,
  onToggleExcludeUrl,
  onNavigateToAchievement,
}: {
  isUppercase: boolean
  onToggleUppercase: () => void
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
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

      <div className="mb-3">
        <CosmeticSettingRow
          label={t('uppercaseLabel')}
          description={t('uppercaseDescription')}
          checked={isUppercase}
          onToggle={onToggleUppercase}
        />
        <CosmeticSettingRow
          label={t('excludeUrlLabel')}
          description={t('excludeUrlDescription')}
          checked={excludeUrl}
          onToggle={onToggleExcludeUrl}
        />
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
            achievementState={achievementState}
          />
        )
      })}
    </div>
  )
}

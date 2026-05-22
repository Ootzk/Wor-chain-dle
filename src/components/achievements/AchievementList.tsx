import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import {
  AdjustmentsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
} from '@heroicons/react/outline'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  getAchievementModes,
  getAchievementsWithStatus,
  markAchievementsSeen,
  AchievementCategory,
} from '../../lib/achievements'
import { loadDailyResultHistory } from '../../lib/dailyResults'
import { loadStats } from '../../lib/stats'
import {
  CosmeticCategory,
  CosmeticOption,
  equipCosmetic,
  getRewardsForAchievement,
  loadCosmeticState,
} from '../../lib/cosmetics'
import { CosmeticPreview } from '../cosmetics/CosmeticPreview'
import {
  filterRewardsByMetadata,
  getRewardMetadataLabel,
  RewardMetadataFilter,
} from '../../lib/rewardMetadata'
import { RELEASE_METADATA } from '../../lib/releaseMetadata'
import { getModeBadgeItems, ModeBadge } from '../modes/ModeBadge'
import { GameMode } from '../../lib/gameMode'

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  milestone: '\uD83C\uDFAF',
  guess: '\uD83C\uDFB2',
  streak: '\uD83D\uDD25',
  event: '\uD83E\uDDE9',
  collection: '\uD83D\uDDC4\uFE0F',
  performance: '\uD83D\uDCCA',
}

const ACHIEVEMENT_CATEGORY_LABEL_KEYS: Record<AchievementCategory, string> = {
  milestone: 'achievementCategoryMilestone',
  guess: 'achievementCategoryGuess',
  streak: 'achievementCategoryStreak',
  event: 'achievementCategoryEvent',
  collection: 'achievementCategoryCollection',
  performance: 'achievementCategoryPerformance',
}

const ACHIEVEMENT_CATEGORY_DESC_KEYS: Record<AchievementCategory, string> = {
  milestone: 'achievementCategoryMilestoneDesc',
  guess: 'achievementCategoryGuessDesc',
  streak: 'achievementCategoryStreakDesc',
  event: 'achievementCategoryEventDesc',
  collection: 'achievementCategoryCollectionDesc',
  performance: 'achievementCategoryPerformanceDesc',
}

const FILTER_ALL = 'all'

type AchievementFilterDisplayMode = 'expanded' | 'collapsed' | 'hidden'
type VisibleAchievementFilterDisplayMode = Exclude<
  AchievementFilterDisplayMode,
  'hidden'
>
type AchievementWithStatus = ReturnType<
  typeof getAchievementsWithStatus
>[number]
type FilterKey = 'version' | 'category' | 'rewardCategory' | 'mode'
type FilterPickerOption = {
  value: string
  label: string
  description: string
  marker?: ReactNode
}

const DEFAULT_FILTER_ORDER: FilterKey[] = [
  'version',
  'category',
  'rewardCategory',
  'mode',
]
const FILTER_PREFERENCES_STORAGE_KEY = 'achievementFilterPreferences'
const createDefaultOptionOrders = (): Record<FilterKey, string[]> => ({
  version: [],
  category: [],
  rewardCategory: [],
  mode: [],
})

type AchievementFilterPreferences = {
  displayMode: VisibleAchievementFilterDisplayMode
  searchQuery: string
  versionFilters: string[]
  categoryFilters: string[]
  rewardCategoryFilters: string[]
  modeFilters: string[]
  filterOrder: FilterKey[]
  optionOrders: Record<FilterKey, string[]>
}

const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []

const normalizeDisplayMode = (
  value: unknown
): VisibleAchievementFilterDisplayMode =>
  value === 'collapsed' ? 'collapsed' : 'expanded'

const normalizeFilterOrder = (value: unknown): FilterKey[] => {
  const seen = new Set<FilterKey>()
  const storedOrder = Array.isArray(value)
    ? value.filter((item): item is FilterKey => {
        if (!DEFAULT_FILTER_ORDER.includes(item as FilterKey)) return false
        if (seen.has(item as FilterKey)) return false
        seen.add(item as FilterKey)
        return true
      })
    : []

  return [
    ...storedOrder,
    ...DEFAULT_FILTER_ORDER.filter((filterKey) => !seen.has(filterKey)),
  ]
}

const normalizeOptionOrders = (
  value: unknown
): Record<FilterKey, string[]> => {
  const optionOrders = createDefaultOptionOrders()
  if (!value || typeof value !== 'object') return optionOrders

  DEFAULT_FILTER_ORDER.forEach((filterKey) => {
    const storedOrder = (value as Partial<Record<FilterKey, unknown>>)[
      filterKey
    ]
    if (Array.isArray(storedOrder)) {
      optionOrders[filterKey] = storedOrder.filter(
        (item): item is string => typeof item === 'string'
      )
    }
  })

  return optionOrders
}

const loadAchievementFilterPreferences = (): AchievementFilterPreferences => {
  const defaults = {
    displayMode: 'expanded' as const,
    searchQuery: '',
    versionFilters: [],
    categoryFilters: [],
    rewardCategoryFilters: [],
    modeFilters: [],
    filterOrder: DEFAULT_FILTER_ORDER,
    optionOrders: createDefaultOptionOrders(),
  }

  try {
    const raw = localStorage.getItem(FILTER_PREFERENCES_STORAGE_KEY)
    if (!raw) return defaults

    const parsed = JSON.parse(raw) as Partial<AchievementFilterPreferences>
    return {
      displayMode: normalizeDisplayMode(parsed.displayMode),
      searchQuery:
        typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
      versionFilters: normalizeStringArray(parsed.versionFilters),
      categoryFilters: normalizeStringArray(parsed.categoryFilters),
      rewardCategoryFilters: normalizeStringArray(
        parsed.rewardCategoryFilters
      ),
      modeFilters: normalizeStringArray(parsed.modeFilters),
      filterOrder: normalizeFilterOrder(parsed.filterOrder),
      optionOrders: normalizeOptionOrders(parsed.optionOrders),
    }
  } catch {
    return defaults
  }
}

const saveAchievementFilterPreferences = (
  preferences: AchievementFilterPreferences
) => {
  try {
    localStorage.setItem(
      FILTER_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    )
  } catch {
    // Filter preferences are convenience-only; ignore storage failures.
  }
}

const normalizeSortableId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_')

const getOptionSortableId = (label: string, value: string): string =>
  `achievement-filter-option-${label}-${normalizeSortableId(value)}`

const mergeOptionOrder = (availableValues: string[], order: string[]) => [
  ...order.filter((value) => availableValues.includes(value)),
  ...availableValues.filter((value) => !order.includes(value)),
]

const getVersionFilterDescription = (
  version: string,
  t: (key: string, options?: Record<string, string>) => string
): string => {
  const release = RELEASE_METADATA[version]
  if (release?.theme) {
    return release.theme
  }
  return t('achievementFilterVersionDesc', { version: `v${version}` })
}

const FILTER_REWARD_MARKERS: Record<CosmeticCategory, ReactNode> = {
  shareEmoji: (
    <CosmeticPreview category="shareEmoji" optionId="emoji_default" compact />
  ),
  shareBadge: (
    <CosmeticPreview category="shareBadge" optionId="badge_chain" compact />
  ),
  cellFont: (
    <CosmeticPreview category="cellFont" optionId="font_marker" compact />
  ),
  cellColor: (
    <CosmeticPreview category="cellColor" optionId="color_grass" compact />
  ),
  chainStyle: (
    <CosmeticPreview category="chainStyle" optionId="chain_thick" compact />
  ),
  chainColor: (
    <CosmeticPreview
      category="chainColor"
      optionId="chaincolor_grass"
      compact
    />
  ),
  endMessage: (
    <CosmeticPreview category="endMessage" optionId="msg_phrase" compact />
  ),
}

const COSMETIC_CATEGORY_DESC_KEYS: Record<CosmeticCategory, string> = {
  shareEmoji: 'achievementRewardShareEmojiDesc',
  shareBadge: 'achievementRewardShareBadgeDesc',
  cellFont: 'achievementRewardCellFontDesc',
  cellColor: 'achievementRewardCellColorDesc',
  chainStyle: 'achievementRewardChainStyleDesc',
  chainColor: 'achievementRewardChainColorDesc',
  endMessage: 'achievementRewardEndMessageDesc',
}

const MODE_DESC_KEYS: Record<GameMode, string> = {
  daily: 'achievementModeDailyDesc',
  practice: 'achievementModePracticeDesc',
  custom: 'achievementModeCustomDesc',
  event: 'achievementModeEventDesc',
}

const SortableDragHandle = ({
  attributes,
  listeners,
}: {
  attributes: any
  listeners?: any
}) => (
  <button
    type="button"
    className="flex cursor-grab items-center justify-center text-gray-300 active:cursor-grabbing"
    {...attributes}
    {...listeners}
  >
    <span
      aria-hidden="true"
      className="grid grid-cols-2 gap-[2px] rounded px-0.5 py-1"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </span>
  </button>
)

const SortableOptionRow = ({
  id,
  option,
  selected,
  onToggle,
}: {
  id: string
  option: FilterPickerOption
  selected: boolean
  onToggle: () => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: option.value === FILTER_ALL })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-full items-stretch border-b border-gray-50 ${
        selected ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 bg-white'
      } ${
        isDragging ? 'relative z-10 opacity-60 shadow-sm' : 'hover:bg-gray-50'
      }`}
    >
      <span className="flex w-7 flex-shrink-0 items-center justify-center">
        {option.value !== FILTER_ALL && (
          <SortableDragHandle attributes={attributes} listeners={listeners} />
        )}
      </span>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 px-2 py-3 text-left text-sm"
        onClick={onToggle}
      >
        <span className="flex w-9 flex-shrink-0 items-center justify-center text-base">
          {option.marker}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{option.label}</span>
          <span
            className={`block text-xs leading-snug ${
              selected ? 'text-indigo-500' : 'text-gray-400'
            }`}
          >
            {option.description}
          </span>
        </span>
        <span className="w-5 flex-shrink-0 text-center">
          {selected && <span className="text-indigo-600">{'\u2713'}</span>}
        </span>
      </button>
    </div>
  )
}

const StaticOptionRow = ({
  option,
  selected,
  onToggle,
}: {
  option: FilterPickerOption
  selected: boolean
  onToggle: () => void
}) => (
  <div
    className={`flex w-full items-stretch border-b border-gray-50 ${
      selected ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-700'
    } hover:bg-gray-50`}
  >
    <span className="flex w-7 flex-shrink-0 items-center justify-center" />
    <button
      type="button"
      className="flex min-w-0 flex-1 items-center gap-3 px-2 py-3 text-left text-sm"
      onClick={onToggle}
    >
      <span className="flex w-9 flex-shrink-0 items-center justify-center text-base">
        {option.marker}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{option.label}</span>
        <span
          className={`block text-xs leading-snug ${
            selected ? 'text-indigo-500' : 'text-gray-400'
          }`}
        >
          {option.description}
        </span>
      </span>
      <span className="w-5 flex-shrink-0 text-center">
        {selected && <span className="text-indigo-600">{'\u2713'}</span>}
      </span>
    </button>
  </div>
)

const FilterPicker = ({
  label,
  values,
  onChange,
  onReset,
  onReorderOption,
  options,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  onReset: () => void
  onReorderOption: (activeValue: string, overValue: string) => void
  options: FilterPickerOption[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const isActive = values.length > 0
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const selectedOptions = options.filter(
    (option) => option.value !== FILTER_ALL && values.includes(option.value)
  )
  const allOption = options[0]
  const displayOption = selectedOptions[0] ?? allOption
  const displayLabel =
    selectedOptions.length > 0
      ? selectedOptions.map((option) => option.label).join(', ')
      : displayOption.label
  const toggleValue = (nextValue: string) => {
    if (nextValue === FILTER_ALL) {
      onChange([])
      return
    }

    if (values.includes(nextValue)) {
      onChange(values.filter((currentValue) => currentValue !== nextValue))
      return
    }

    onChange([...values, nextValue])
  }
  const sortableOptions = options
    .filter((option) => option.value !== FILTER_ALL)
    .map((option) => getOptionSortableId(label, option.value))
  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeOption = options.find(
      (option) => getOptionSortableId(label, option.value) === active.id
    )
    const overOption = options.find(
      (option) => getOptionSortableId(label, option.value) === over.id
    )
    if (activeOption && overOption) {
      onReorderOption(activeOption.value, overOption.value)
    }
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_1.75rem_1.75rem] overflow-hidden rounded border border-gray-300 bg-white">
      <button
        type="button"
        className="flex h-7 min-w-0 items-center px-2 text-left text-xs text-gray-700"
        onClick={() => setIsOpen(true)}
        aria-label={label}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
      </button>
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center border-l text-xs font-semibold ${
          isActive
            ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
            : 'cursor-default border-gray-200 text-gray-200'
        }`}
        disabled={!isActive}
        onClick={onReset}
        aria-label={`${label} reset`}
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center border-l border-gray-300 text-gray-500 hover:bg-gray-50"
        onClick={() => setIsOpen(true)}
        aria-label={label}
      >
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30 px-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="max-h-[80vh] w-80 max-w-full overflow-y-auto rounded-lg bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-4 py-3">
                <span className="text-sm font-bold text-gray-900">{label}</span>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOptionDragEnd}
              >
                <SortableContext
                  items={sortableOptions}
                  strategy={verticalListSortingStrategy}
                >
                  {options.map((option) => {
                    const selected =
                      option.value === FILTER_ALL
                        ? selectedOptions.length === 0
                        : values.includes(option.value)
                    if (option.value === FILTER_ALL) {
                      return (
                        <StaticOptionRow
                          key={option.value}
                          option={option}
                          selected={selected}
                          onToggle={() => toggleValue(option.value)}
                        />
                      )
                    }
                    return (
                      <SortableOptionRow
                        key={option.value}
                        id={getOptionSortableId(label, option.value)}
                        option={option}
                        selected={selected}
                        onToggle={() => toggleValue(option.value)}
                      />
                    )
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

const FilterRow = ({
  filterKey,
  label,
  values,
  onChange,
  onReorderOption,
  options,
}: {
  filterKey: FilterKey
  label: string
  values: string[]
  onChange: (values: string[]) => void
  onReorderOption: (activeValue: string, overValue: string) => void
  options: FilterPickerOption[]
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: filterKey })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[1.25rem_8.25rem_minmax(0,1fr)] items-center gap-x-1 ${
        isDragging ? 'relative z-10 opacity-60' : ''
      }`}
    >
      <SortableDragHandle attributes={attributes} listeners={listeners} />
      <span className="truncate whitespace-nowrap text-xs font-semibold text-gray-500">
        {label}
      </span>
      <FilterPicker
        label={label}
        values={values}
        onChange={onChange}
        onReset={() => onChange([])}
        onReorderOption={onReorderOption}
        options={options}
      />
    </div>
  )
}

const FilterShell = ({
  mode,
  summary,
  resultCount,
  totalCount,
  hasActiveFilters,
  onExpand,
  onCollapse,
  onReset,
  children,
}: {
  mode: Exclude<AchievementFilterDisplayMode, 'hidden'>
  summary: string
  resultCount: number
  totalCount: number
  hasActiveFilters: boolean
  onExpand: () => void
  onCollapse: () => void
  onReset: () => void
  children: ReactNode
}) => {
  const { t } = useTranslation()
  const countLabel = t('achievementFilterCount', {
    count: resultCount,
    total: totalCount,
  })
  const resetButton = (
    <button
      type="button"
      className={`flex h-7 w-7 items-center justify-center rounded-l border text-xs font-semibold ${
        hasActiveFilters
          ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
          : 'cursor-default border-gray-200 text-gray-200'
      }`}
      disabled={!hasActiveFilters}
      onClick={(event) => {
        event.stopPropagation()
        onReset()
      }}
      aria-label={t('achievementFilterResetAll')}
    >
      <XIcon className="h-3.5 w-3.5" />
    </button>
  )

  if (mode === 'collapsed') {
    return (
      <div className="sticky top-0 z-10 rounded border border-gray-200 bg-white p-2 text-xs">
        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-1">
          <button
            type="button"
            className="min-w-0 text-left text-gray-500"
            onClick={onExpand}
            aria-label={t('achievementFilterExpand')}
          >
            <span className="grid min-w-0 grid-cols-[1.5rem_auto_minmax(0,1fr)] items-center gap-x-1">
              <span
                className="flex items-center justify-center font-semibold text-gray-900"
                aria-label={t('achievementFilters')}
              >
                <AdjustmentsIcon className="h-6 w-6" />
              </span>
              <span className="text-gray-300">|</span>
              <span className="min-w-0 truncate">{summary}</span>
            </span>
          </button>
          <div className="flex">
            {resetButton}
            <button
              type="button"
              className="-ml-px flex h-7 w-7 items-center justify-center rounded-r border border-gray-300 text-gray-500 hover:bg-gray-50"
              onClick={onExpand}
              aria-label={t('achievementFilterExpand')}
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 space-y-2 rounded border border-gray-200 bg-white p-2">
      <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-1 text-xs">
        <span className="min-w-0 text-gray-500">
          <span className="grid min-w-0 grid-cols-[1.5rem_auto_minmax(0,1fr)] items-center gap-x-1">
            <span
              className="flex items-center justify-center font-semibold text-gray-900"
              aria-label={t('achievementFilters')}
            >
              <AdjustmentsIcon className="h-6 w-6" />
            </span>
            <span className="text-gray-300">|</span>
            <span className="min-w-0 truncate">{countLabel}</span>
          </span>
        </span>
        <div className="flex">
          {resetButton}
          <button
            type="button"
            className="-ml-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-r border border-gray-300 text-gray-500 hover:bg-gray-50"
            onClick={onCollapse}
            aria-label={t('achievementFilterCollapse')}
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

const DifficultyStars = ({ difficulty }: { difficulty: number }) => {
  return (
    <span className="text-xs text-yellow-500 whitespace-nowrap">
      {'★'.repeat(difficulty)}
      {'☆'.repeat(10 - difficulty)}
    </span>
  )
}

const ProgressBar = ({
  current,
  target,
}: {
  current: number
  target: number
}) => {
  const percent = Math.min((current / target) * 100, 100)
  return (
    <div className="mt-1">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-right">
        <span className="text-[0.625rem] text-gray-400">
          {current}/{target}
        </span>
      </div>
    </div>
  )
}

const AchievementEquipButton = ({
  rewards,
  unlocked,
  equipped,
  onEquip,
}: {
  rewards: CosmeticOption[]
  unlocked: boolean
  equipped: Record<CosmeticCategory, string>
  onEquip: (rewards: CosmeticOption[]) => void
}) => {
  const { t } = useTranslation()
  if (rewards.length === 0) return null

  const isEquipped = rewards.every(
    (reward) => equipped[reward.category] === reward.id
  )
  const disabled = !unlocked || isEquipped
  const label = !unlocked
    ? t('locked')
    : isEquipped
    ? t('equipped')
    : t('equip')

  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex w-8 flex-shrink-0 items-center justify-center border-l text-lg font-semibold transition-colors ${
        !unlocked
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
          : isEquipped
          ? 'cursor-default border-green-500 bg-green-500 text-white'
          : 'border-green-400 bg-green-50 text-green-600 hover:bg-green-100'
      }`}
      onClick={() => onEquip(rewards)}
      title={rewards.map((reward) => t(reward.titleKey)).join(', ')}
      aria-label={label}
    >
      {!unlocked ? '\uD83D\uDD12' : isEquipped ? '\u2713' : '\uD83D\uDD13'}
    </button>
  )
}

const AchievementDescription = ({
  achievementId,
  descriptionKey,
  onOpenDeadEndHelp,
  onOpenEventRecords,
}: {
  achievementId: string
  descriptionKey: string
  onOpenDeadEndHelp?: () => void
  onOpenEventRecords?: () => void
}) => {
  const { t } = useTranslation()

  if (achievementId === 'dead_end_tail' && onOpenDeadEndHelp) {
    return (
      <Trans
        i18nKey={descriptionKey}
        components={{
          deadEndLink: (
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline"
              onClick={onOpenDeadEndHelp}
            />
          ),
        }}
      />
    )
  }

  if (
    [
      'clover_collector',
      'rabbit_speed',
      'grassland_trail',
      'grass_diet',
    ].includes(achievementId)
  ) {
    return (
      <Trans
        i18nKey={descriptionKey}
        components={{
          eventLink: onOpenEventRecords ? (
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-700 underline"
              onClick={onOpenEventRecords}
            />
          ) : (
            <span className="font-medium text-indigo-600 underline" />
          ),
        }}
      />
    )
  }

  return <>{t(descriptionKey)}</>
}

export const AchievementList = ({
  scrollToId,
  onOpenDeadEndHelp,
  onOpenEventRecords,
  metadataFilter,
  achievementIds,
  sortAchievementIds,
  initialVersionFilters,
  persistFilters,
  mode = 'daily',
  embedded = false,
  markSeenOnUnmount = true,
  showFilters = false,
  filterDisplayMode,
}: {
  scrollToId?: string
  onOpenDeadEndHelp?: () => void
  onOpenEventRecords?: () => void
  metadataFilter?: RewardMetadataFilter
  achievementIds?: string[]
  sortAchievementIds?: string[]
  initialVersionFilters?: string[]
  persistFilters?: boolean
  mode?: GameMode
  embedded?: boolean
  markSeenOnUnmount?: boolean
  showFilters?: boolean
  filterDisplayMode?: AchievementFilterDisplayMode
}) => {
  const { t } = useTranslation()
  const [initialFilterPreferences] = useState(
    loadAchievementFilterPreferences
  )
  const shouldUsePersistentFilters =
    persistFilters ??
    (showFilters && !embedded && filterDisplayMode !== 'hidden')
  const resolvedFilterDisplayMode =
    filterDisplayMode ??
    (showFilters && !embedded ? initialFilterPreferences.displayMode : 'hidden')
  const [activeFilterDisplayMode, setActiveFilterDisplayMode] =
    useState<AchievementFilterDisplayMode>(resolvedFilterDisplayMode)
  const [searchQuery, setSearchQuery] = useState(
    shouldUsePersistentFilters ? initialFilterPreferences.searchQuery : ''
  )
  const [versionFilters, setVersionFilters] = useState<string[]>(
    initialVersionFilters ??
      (shouldUsePersistentFilters
        ? initialFilterPreferences.versionFilters
        : [])
  )
  const [categoryFilters, setCategoryFilters] = useState<string[]>(
    shouldUsePersistentFilters ? initialFilterPreferences.categoryFilters : []
  )
  const [rewardCategoryFilters, setRewardCategoryFilters] = useState<string[]>(
    shouldUsePersistentFilters
      ? initialFilterPreferences.rewardCategoryFilters
      : []
  )
  const [modeFilters, setModeFilters] = useState<string[]>(
    shouldUsePersistentFilters ? initialFilterPreferences.modeFilters : []
  )
  const [filterOrder, setFilterOrder] = useState<FilterKey[]>(
    initialFilterPreferences.filterOrder
  )
  const [optionOrders, setOptionOrders] = useState<Record<FilterKey, string[]>>(
    initialFilterPreferences.optionOrders
  )
  const filterSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const stats = loadStats()
  const dailyHistory = loadDailyResultHistory()
  const achievementsWithMetadata = metadataFilter
    ? filterRewardsByMetadata(
        getAchievementsWithStatus(stats, dailyHistory, mode),
        metadataFilter
      )
    : getAchievementsWithStatus(stats, dailyHistory, mode)
  const scopedAchievements = achievementIds
    ? achievementsWithMetadata.filter((achievement) =>
        achievementIds.includes(achievement.id)
      )
    : achievementsWithMetadata
  const versionOptions = mergeOptionOrder(
    uniqueSorted(
      scopedAchievements
        .map((achievement) => achievement.metadata?.introducedInVersion)
        .filter((version): version is string => !!version)
    ).reverse(),
    optionOrders.version
  )
  const categoryOptions = mergeOptionOrder(
    uniqueSorted(
      scopedAchievements.map((achievement) => achievement.category)
    ) as AchievementCategory[],
    optionOrders.category
  ) as AchievementCategory[]
  const rewardCategoryOptions = mergeOptionOrder(
    uniqueSorted(
      scopedAchievements.flatMap((achievement) =>
        getRewardsForAchievement(achievement.id).map(
          (reward) => reward.category
        )
      )
    ) as CosmeticCategory[],
    optionOrders.rewardCategory
  ) as CosmeticCategory[]
  const modeOptions = mergeOptionOrder(
    uniqueSorted(
      scopedAchievements.flatMap((achievement) =>
        getAchievementModes(achievement)
      )
    ) as GameMode[],
    optionOrders.mode
  ) as GameMode[]
  const reorderOption = (
    filterKey: FilterKey,
    activeValue: string,
    overValue: string
  ) => {
    setOptionOrders((currentOrders) => {
      const availableValues = {
        version: versionOptions,
        category: categoryOptions,
        rewardCategory: rewardCategoryOptions,
        mode: modeOptions,
      }[filterKey]
      const currentOrder = mergeOptionOrder(
        availableValues,
        currentOrders[filterKey]
      )
      const oldIndex = currentOrder.indexOf(activeValue)
      const newIndex = currentOrder.indexOf(overValue)
      if (oldIndex === -1 || newIndex === -1) return currentOrders
      return {
        ...currentOrders,
        [filterKey]: arrayMove(currentOrder, oldIndex, newIndex),
      }
    })
  }
  const handleFilterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filterOrder.indexOf(active.id as FilterKey)
    const newIndex = filterOrder.indexOf(over.id as FilterKey)
    if (oldIndex !== -1 && newIndex !== -1) {
      setFilterOrder(arrayMove(filterOrder, oldIndex, newIndex))
    }
  }
  const getRank = (filterKey: FilterKey, value?: string): number => {
    if (!value) return Number.MAX_SAFE_INTEGER
    const optionsByKey: Record<FilterKey, string[]> = {
      version: versionOptions,
      category: categoryOptions,
      rewardCategory: rewardCategoryOptions,
      mode: modeOptions,
    }
    const rank = optionsByKey[filterKey].indexOf(value)
    return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
  }
  const getAchievementSortRank = (
    achievement: AchievementWithStatus,
    filterKey: FilterKey
  ): number => {
    if (filterKey === 'version') {
      return getRank(filterKey, achievement.metadata?.introducedInVersion)
    }
    if (filterKey === 'category') {
      return getRank(filterKey, achievement.category)
    }
    if (filterKey === 'rewardCategory') {
      const ranks = getRewardsForAchievement(achievement.id).map((reward) =>
        getRank(filterKey, reward.category)
      )
      return ranks.length > 0 ? Math.min(...ranks) : Number.MAX_SAFE_INTEGER
    }
    const ranks = getAchievementModes(achievement).map((achievementMode) =>
      getRank(filterKey, achievementMode)
    )
    return ranks.length > 0 ? Math.min(...ranks) : Number.MAX_SAFE_INTEGER
  }
  const sourceIndexById = new Map(
    scopedAchievements.map(
      (achievement, index) => [achievement.id, index] as const
    )
  )
  const explicitSortIndexById = sortAchievementIds
    ? new Map(
        sortAchievementIds.map(
          (achievementId, index) => [achievementId, index] as const
        )
      )
    : undefined
  const versionFilterOptions: FilterPickerOption[] = [
    {
      value: FILTER_ALL,
      label: t('achievementFilterAllOption'),
      description: t('achievementFilterAllVersionsDesc'),
    },
    ...versionOptions.map((version) => ({
      value: version,
      label: `v${version}`,
      description: getVersionFilterDescription(version, t),
    })),
  ]
  const categoryFilterOptions: FilterPickerOption[] = [
    {
      value: FILTER_ALL,
      label: t('achievementFilterAllOption'),
      description: t('achievementFilterAllCategoriesDesc'),
    },
    ...categoryOptions.map((category) => ({
      value: category,
      label: t(ACHIEVEMENT_CATEGORY_LABEL_KEYS[category]),
      description: t(ACHIEVEMENT_CATEGORY_DESC_KEYS[category]),
      marker: (
        <span className="text-lg leading-none">{CATEGORY_ICONS[category]}</span>
      ),
    })),
  ]
  const rewardCategoryFilterOptions: FilterPickerOption[] = [
    {
      value: FILTER_ALL,
      label: t('achievementFilterAllOption'),
      description: t('achievementFilterAllRewardsDesc'),
    },
    ...rewardCategoryOptions.map((category) => ({
      value: category,
      label: t(`${category}Label`),
      description: t(COSMETIC_CATEGORY_DESC_KEYS[category]),
      marker: FILTER_REWARD_MARKERS[category],
    })),
  ]
  const modeFilterOptions: FilterPickerOption[] = [
    {
      value: FILTER_ALL,
      label: t('achievementFilterAllOption'),
      description: t('achievementFilterAllModesDesc'),
    },
    ...modeOptions.map((mode) => ({
      value: mode,
      label: t(mode),
      description: t(MODE_DESC_KEYS[mode]),
      marker: <ModeBadge mode={mode} label={t(mode)} />,
    })),
  ]
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const achievements = scopedAchievements
    .filter((achievement) => {
      const rewards = getRewardsForAchievement(achievement.id)
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          t(achievement.titleKey),
          t(achievement.descriptionKey),
          ...rewards.map((reward) => t(reward.titleKey)),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      const matchesVersion =
        versionFilters.length === 0 ||
        versionFilters.includes(achievement.metadata?.introducedInVersion ?? '')
      const matchesCategory =
        categoryFilters.length === 0 ||
        categoryFilters.includes(achievement.category)
      const matchesRewardCategory =
        rewardCategoryFilters.length === 0 ||
        rewards.some((reward) =>
          rewardCategoryFilters.includes(reward.category)
        )
      const matchesMode =
        modeFilters.length === 0 ||
        getAchievementModes(achievement).some((achievementMode) =>
          modeFilters.includes(achievementMode)
        )

      return (
        matchesSearch &&
        matchesVersion &&
        matchesCategory &&
        matchesRewardCategory &&
        matchesMode
      )
    })
    .sort((a, b) => {
      if (explicitSortIndexById) {
        const aIndex = explicitSortIndexById.get(a.id)
        const bIndex = explicitSortIndexById.get(b.id)
        if (aIndex !== undefined || bIndex !== undefined) {
          if (aIndex === undefined) return 1
          if (bIndex === undefined) return -1
          if (aIndex !== bIndex) return aIndex - bIndex
        }
      }
      for (const filterKey of filterOrder) {
        const rankDiff =
          getAchievementSortRank(a, filterKey) -
          getAchievementSortRank(b, filterKey)
        if (rankDiff !== 0) return rankDiff
      }
      return (sourceIndexById.get(a.id) ?? 0) - (sourceIndexById.get(b.id) ?? 0)
    })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [equipped, setEquipped] = useState(() => loadCosmeticState().equipped)

  useEffect(() => {
    setActiveFilterDisplayMode(resolvedFilterDisplayMode)
  }, [resolvedFilterDisplayMode])

  useEffect(() => {
    if (!shouldUsePersistentFilters || activeFilterDisplayMode === 'hidden') {
      return
    }

    saveAchievementFilterPreferences({
      displayMode: activeFilterDisplayMode,
      searchQuery,
      versionFilters,
      categoryFilters,
      rewardCategoryFilters,
      modeFilters,
      filterOrder,
      optionOrders,
    })
  }, [
    activeFilterDisplayMode,
    searchQuery,
    versionFilters,
    categoryFilters,
    rewardCategoryFilters,
    modeFilters,
    filterOrder,
    optionOrders,
    shouldUsePersistentFilters,
  ])

  const handleEquipRewards = (rewards: CosmeticOption[]) => {
    rewards.forEach((reward) => {
      equipCosmetic(reward.category, reward.id)
    })
    setEquipped(loadCosmeticState().equipped)
  }

  const activeFilterLabels = [
    normalizedSearch ? `"${searchQuery.trim()}"` : '',
    ...versionFilters.map((version) => `v${version}`),
    ...categoryFilters.map((category) =>
      t(ACHIEVEMENT_CATEGORY_LABEL_KEYS[category as AchievementCategory])
    ),
    ...rewardCategoryFilters.map((category) =>
      t(`${category as CosmeticCategory}Label`)
    ),
    ...modeFilters.map((mode) => t(mode)),
  ].filter(Boolean)
  const filterSummary =
    activeFilterLabels.length > 0
      ? activeFilterLabels.join(', ')
      : t('achievementFilterSummaryAll')
  const hasActiveFilters =
    normalizedSearch.length > 0 ||
    versionFilters.length > 0 ||
    categoryFilters.length > 0 ||
    rewardCategoryFilters.length > 0 ||
    modeFilters.length > 0
  const resetFilters = () => {
    setSearchQuery('')
    setVersionFilters([])
    setCategoryFilters([])
    setRewardCategoryFilters([])
    setModeFilters([])
  }
  const filterRowConfigs: Record<
    FilterKey,
    {
      label: string
      values: string[]
      onChange: (values: string[]) => void
      options: FilterPickerOption[]
    }
  > = {
    version: {
      label: t('achievementFilterVersionTheme'),
      values: versionFilters,
      onChange: setVersionFilters,
      options: versionFilterOptions,
    },
    category: {
      label: t('achievementFilterAchievementType'),
      values: categoryFilters,
      onChange: setCategoryFilters,
      options: categoryFilterOptions,
    },
    rewardCategory: {
      label: t('achievementFilterCosmeticCategory'),
      values: rewardCategoryFilters,
      onChange: setRewardCategoryFilters,
      options: rewardCategoryFilterOptions,
    },
    mode: {
      label: t('achievementFilterGameMode'),
      values: modeFilters,
      onChange: setModeFilters,
      options: modeFilterOptions,
    },
  }

  useEffect(() => {
    return () => {
      if (markSeenOnUnmount) {
        markAchievementsSeen()
      }
    }
  }, [markSeenOnUnmount])

  useEffect(() => {
    if (scrollToId && scrollRef.current) {
      const el = scrollRef.current.querySelector(
        `[data-achievement-id="${scrollToId}"]`
      )
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100
        )
      }
    }
  }, [scrollToId])

  return (
    <div
      ref={scrollRef}
      className={
        embedded ? 'space-y-2 pr-1' : 'h-full overflow-y-auto space-y-2 pr-1'
      }
    >
      {activeFilterDisplayMode !== 'hidden' && (
        <FilterShell
          mode={activeFilterDisplayMode}
          summary={filterSummary}
          resultCount={achievements.length}
          totalCount={scopedAchievements.length}
          hasActiveFilters={hasActiveFilters}
          onExpand={() => setActiveFilterDisplayMode('expanded')}
          onCollapse={() => setActiveFilterDisplayMode('collapsed')}
          onReset={resetFilters}
        >
          <input
            type="search"
            className="h-7 w-full rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('achievementSearchPlaceholder')}
          />
          <DndContext
            sensors={filterSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFilterDragEnd}
          >
            <SortableContext
              items={filterOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {filterOrder.map((filterKey) => {
                  const config = filterRowConfigs[filterKey]
                  return (
                    <FilterRow
                      key={filterKey}
                      filterKey={filterKey}
                      label={config.label}
                      values={config.values}
                      onChange={config.onChange}
                      onReorderOption={(activeValue, overValue) =>
                        reorderOption(filterKey, activeValue, overValue)
                      }
                      options={config.options}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
          {achievements.length === 0 && (
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
              {t('achievementFilterNoResults')}
            </div>
          )}
        </FilterShell>
      )}
      {achievements.map((achievement) => {
        const rewards = getRewardsForAchievement(achievement.id)
        return (
          <div
            key={achievement.id}
            data-achievement-id={achievement.id}
            className={`flex min-h-[5.5rem] items-stretch overflow-hidden rounded-lg transition-colors ${
              scrollToId === achievement.id
                ? 'border-2 border-indigo-500 shadow-md bg-indigo-50'
                : achievement.unlocked
                ? 'border border-green-500 bg-green-50'
                : 'border border-gray-200'
            }`}
          >
            <div className="min-w-0 flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0 w-7 text-center inline-block">
                      {CATEGORY_ICONS[achievement.category]}
                    </span>
                    <span className="text-sm font-semibold truncate text-gray-900">
                      {t(achievement.titleKey)}
                    </span>
                    {achievement.isNew && (
                      <span className="text-[0.625rem] font-bold text-yellow-600 bg-yellow-100 rounded px-1 py-0.5 flex-shrink-0">
                        NEW!
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-gray-600 text-left">
                    <span className="inline-flex flex-wrap items-center gap-1 align-middle mr-1">
                      {getModeBadgeItems(getAchievementModes(achievement)).map(
                        (badge) => (
                          <ModeBadge
                            key={badge.id}
                            mode={badge.id}
                            label={badge.label}
                          />
                        )
                      )}
                    </span>
                    <span>
                      <AchievementDescription
                        achievementId={achievement.id}
                        descriptionKey={achievement.descriptionKey}
                        onOpenDeadEndHelp={onOpenDeadEndHelp}
                        onOpenEventRecords={onOpenEventRecords}
                      />
                    </span>
                  </p>
                  {rewards.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {rewards.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-1.5 text-xs text-gray-500"
                        >
                          <span>{t(`${r.category}Label`)}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center">
                            <CosmeticPreview
                              category={r.category}
                              optionId={r.id}
                              compact
                            />
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>{t(r.titleKey)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <DifficultyStars difficulty={achievement.difficulty} />
                  <ProgressBar
                    current={achievement.currentProgress.current}
                    target={achievement.currentProgress.target}
                  />
                  {achievement.metadata && (
                    <div className="mt-0.5 text-right text-[0.625rem] text-gray-400">
                      {getRewardMetadataLabel(achievement.metadata)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <AchievementEquipButton
              rewards={rewards}
              unlocked={achievement.unlocked}
              equipped={equipped}
              onEquip={handleEquipRewards}
            />
          </div>
        )
      })}
    </div>
  )
}

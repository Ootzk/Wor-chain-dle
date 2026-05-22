import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
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
type FilterPickerOption = {
  value: string
  label: string
  description: string
  marker?: ReactNode
}

const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

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

const FilterPicker = ({
  label,
  values,
  onChange,
  options,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  options: FilterPickerOption[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
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

  return (
    <div className="min-w-0">
      <button
        type="button"
        className="flex h-5 w-full items-center justify-between gap-1.5 rounded border border-gray-300 bg-white px-1.5 text-left text-[0.625rem] text-gray-700"
        onClick={() => setIsOpen(true)}
        aria-label={label}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <span className="flex-shrink-0 text-gray-400">{'\u25BE'}</span>
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
              {options.map((option) => {
                const selected =
                  option.value === FILTER_ALL
                    ? selectedOptions.length === 0
                    : values.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left text-sm ${
                      selected
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      toggleValue(option.value)
                    }}
                  >
                    <span className="flex w-9 flex-shrink-0 items-center justify-center text-base">
                      {option.marker}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {option.label}
                      </span>
                      <span
                        className={`block text-xs leading-snug ${
                          selected ? 'text-indigo-500' : 'text-gray-400'
                        }`}
                      >
                        {option.description}
                      </span>
                    </span>
                    <span className="w-5 flex-shrink-0 text-center">
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
        )}
    </div>
  )
}

const FilterRow = ({
  label,
  values,
  onChange,
  options,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  options: FilterPickerOption[]
}) => {
  const isActive = values.length > 0
  return (
    <div className="grid grid-cols-[8.25rem_minmax(0,1fr)_1.25rem] items-center gap-x-1.5">
      <span className="truncate whitespace-nowrap text-xs font-semibold text-gray-500">
        {label}
      </span>
      <FilterPicker
        label={label}
        values={values}
        onChange={onChange}
        options={options}
      />
      <button
        type="button"
        className={`flex h-5 w-5 items-center justify-center rounded border text-[0.625rem] font-semibold ${
          isActive
            ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
            : 'cursor-default border-transparent text-gray-200'
        }`}
        disabled={!isActive}
        onClick={() => onChange([])}
        aria-label={`${label} reset`}
      >
        {'×'}
      </button>
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
      className={`flex h-5 w-5 items-center justify-center rounded border text-[0.625rem] font-semibold ${
        hasActiveFilters
          ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
          : 'cursor-default border-transparent text-gray-200'
      }`}
      disabled={!hasActiveFilters}
      onClick={(event) => {
        event.stopPropagation()
        onReset()
      }}
      aria-label={t('achievementFilterResetAll')}
    >
      {'×'}
    </button>
  )

  if (mode === 'collapsed') {
    return (
      <div className="sticky top-0 z-10 rounded border border-gray-200 bg-white p-2 text-xs">
        <div className="grid grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-x-1.5">
          <button
            type="button"
            className="flex min-w-0 items-center justify-between gap-2 text-left text-gray-500"
            onClick={onExpand}
            aria-label={t('achievementFilterExpand')}
          >
            <span className="min-w-0 truncate">
              <span className="font-semibold text-gray-900">
                {t('achievementFilters')}
              </span>
              <span className="mx-1 text-gray-300">|</span>
              {summary}
            </span>
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-gray-200 text-[0.625rem] text-gray-500 hover:bg-gray-50">
              {'\u25BE'}
            </span>
          </button>
          {resetButton}
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 space-y-2 rounded border border-gray-200 bg-white p-2">
      <div className="grid grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-x-1.5 text-xs">
        <span className="flex min-w-0 items-center justify-between gap-2 text-gray-500">
          <span className="min-w-0 truncate">
            <span className="font-semibold text-gray-900">
              {t('achievementFilters')}
            </span>
            <span className="mx-1 text-gray-300">|</span>
            {countLabel}
          </span>
          <button
            type="button"
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-gray-200 text-[0.625rem] text-gray-500 hover:bg-gray-50"
            onClick={onCollapse}
            aria-label={t('achievementFilterCollapse')}
          >
            {'\u25B4'}
          </button>
        </span>
        {resetButton}
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
  mode?: GameMode
  embedded?: boolean
  markSeenOnUnmount?: boolean
  showFilters?: boolean
  filterDisplayMode?: AchievementFilterDisplayMode
}) => {
  const { t } = useTranslation()
  const resolvedFilterDisplayMode =
    filterDisplayMode ?? (showFilters && !embedded ? 'expanded' : 'hidden')
  const [activeFilterDisplayMode, setActiveFilterDisplayMode] =
    useState<AchievementFilterDisplayMode>(resolvedFilterDisplayMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [versionFilters, setVersionFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [rewardCategoryFilters, setRewardCategoryFilters] = useState<string[]>(
    []
  )
  const [modeFilters, setModeFilters] = useState<string[]>([])
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
  const versionOptions = uniqueSorted(
    scopedAchievements
      .map((achievement) => achievement.metadata?.introducedInVersion)
      .filter((version): version is string => !!version)
  ).reverse()
  const categoryOptions = uniqueSorted(
    scopedAchievements.map((achievement) => achievement.category)
  ) as AchievementCategory[]
  const rewardCategoryOptions = uniqueSorted(
    scopedAchievements.flatMap((achievement) =>
      getRewardsForAchievement(achievement.id).map((reward) => reward.category)
    )
  ) as CosmeticCategory[]
  const modeOptions = uniqueSorted(
    scopedAchievements.flatMap((achievement) =>
      getAchievementModes(achievement)
    )
  ) as GameMode[]
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
  const achievements = scopedAchievements.filter((achievement) => {
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
      rewards.some((reward) => rewardCategoryFilters.includes(reward.category))
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [equipped, setEquipped] = useState(() => loadCosmeticState().equipped)

  useEffect(() => {
    setActiveFilterDisplayMode(resolvedFilterDisplayMode)
  }, [resolvedFilterDisplayMode])

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
            className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('achievementSearchPlaceholder')}
          />
          <div className="space-y-1.5">
            <FilterRow
              label={t('achievementFilterVersionTheme')}
              values={versionFilters}
              onChange={setVersionFilters}
              options={versionFilterOptions}
            />
            <FilterRow
              label={t('achievementFilterAchievementType')}
              values={categoryFilters}
              onChange={setCategoryFilters}
              options={categoryFilterOptions}
            />
            <FilterRow
              label={t('achievementFilterCosmeticCategory')}
              values={rewardCategoryFilters}
              onChange={setRewardCategoryFilters}
              options={rewardCategoryFilterOptions}
            />
            <FilterRow
              label={t('achievementFilterGameMode')}
              values={modeFilters}
              onChange={setModeFilters}
              options={modeFilterOptions}
            />
          </div>
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

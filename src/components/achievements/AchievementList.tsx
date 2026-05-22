import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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

const FILTER_ALL = 'all'

type AchievementFilterDisplayMode = 'expanded' | 'collapsed' | 'hidden'

const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) => (
  <label className="min-w-0">
    <span className="sr-only">{label}</span>
    <select
      className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value={FILTER_ALL}>{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

const FilterShell = ({
  mode,
  summary,
  resultCount,
  totalCount,
  onExpand,
  onCollapse,
  children,
}: {
  mode: Exclude<AchievementFilterDisplayMode, 'hidden'>
  summary: string
  resultCount: number
  totalCount: number
  onExpand: () => void
  onCollapse: () => void
  children: ReactNode
}) => {
  const { t } = useTranslation()
  const countLabel = t('achievementFilterCount', {
    count: resultCount,
    total: totalCount,
  })

  if (mode === 'collapsed') {
    return (
      <button
        type="button"
        className="sticky top-0 z-10 flex w-full items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-600"
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
        <span className="flex-shrink-0 text-gray-400">
          {countLabel} {'\u25BE'}
        </span>
      </button>
    )
  }

  return (
    <div className="sticky top-0 z-10 space-y-2 bg-white pb-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate text-gray-500">
          <span className="font-semibold text-gray-900">
            {t('achievementFilters')}
          </span>
          <span className="mx-1 text-gray-300">|</span>
          {countLabel}
        </span>
        <button
          type="button"
          className="rounded border border-gray-200 px-2 py-0.5 text-gray-500 hover:bg-gray-50"
          onClick={onCollapse}
          aria-label={t('achievementFilterCollapse')}
        >
          {'\u25B4'}
        </button>
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
  const label = !unlocked ? t('locked') : isEquipped ? t('equipped') : t('equip')

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
      {!unlocked ? (
        '\uD83D\uDD12'
      ) : isEquipped ? (
        '\u2713'
      ) : (
        '\uD83D\uDD13'
      )}
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
  const [versionFilter, setVersionFilter] = useState(FILTER_ALL)
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL)
  const [rewardCategoryFilter, setRewardCategoryFilter] = useState(FILTER_ALL)
  const [modeFilter, setModeFilter] = useState(FILTER_ALL)
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
      versionFilter === FILTER_ALL ||
      achievement.metadata?.introducedInVersion === versionFilter
    const matchesCategory =
      categoryFilter === FILTER_ALL || achievement.category === categoryFilter
    const matchesRewardCategory =
      rewardCategoryFilter === FILTER_ALL ||
      rewards.some((reward) => reward.category === rewardCategoryFilter)
    const matchesMode =
      modeFilter === FILTER_ALL ||
      getAchievementModes(achievement).includes(modeFilter as GameMode)

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
    versionFilter !== FILTER_ALL ? `v${versionFilter}` : '',
    categoryFilter !== FILTER_ALL
      ? t(ACHIEVEMENT_CATEGORY_LABEL_KEYS[categoryFilter as AchievementCategory])
      : '',
    rewardCategoryFilter !== FILTER_ALL
      ? t(`${rewardCategoryFilter}Label`)
      : '',
    modeFilter !== FILTER_ALL ? t(modeFilter) : '',
  ].filter(Boolean)
  const filterSummary =
    activeFilterLabels.length > 0
      ? activeFilterLabels.join(', ')
      : t('achievementFilterSummaryAll')

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
          onExpand={() => setActiveFilterDisplayMode('expanded')}
          onCollapse={() => setActiveFilterDisplayMode('collapsed')}
        >
          <input
            type="search"
            className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('achievementSearchPlaceholder')}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <FilterSelect
              label={t('achievementFilterVersion')}
              value={versionFilter}
              onChange={setVersionFilter}
              options={versionOptions.map((version) => ({
                value: version,
                label: `v${version}`,
              }))}
            />
            <FilterSelect
              label={t('achievementFilterCategory')}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions.map((category) => ({
                value: category,
                label: t(ACHIEVEMENT_CATEGORY_LABEL_KEYS[category]),
              }))}
            />
            <FilterSelect
              label={t('achievementFilterReward')}
              value={rewardCategoryFilter}
              onChange={setRewardCategoryFilter}
              options={rewardCategoryOptions.map((category) => ({
                value: category,
                label: t(`${category}Label`),
              }))}
            />
            <FilterSelect
              label={t('achievementFilterMode')}
              value={modeFilter}
              onChange={setModeFilter}
              options={modeOptions.map((mode) => ({
                value: mode,
                label: t(mode),
              }))}
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

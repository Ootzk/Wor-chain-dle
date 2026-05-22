import { useEffect, useState } from 'react'
import { SparklesIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { AchievementList } from '../achievements/AchievementList'
import { CosmeticsPanel } from '../rewards/CosmeticsPanel'
import { BaseModal } from './BaseModal'
import { EventDefinition } from '../../lib/events'
import { GameMode } from '../../lib/gameMode'
import { normalizeRewardVersion } from '../../lib/rewardMetadata'

type RewardsTab = 'achievements' | 'cosmetics'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isUppercase: boolean
  onToggleUppercase: () => void
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
  initialTab?: RewardsTab
  scrollToAchievement?: string
  onOpenDeadEndHelp?: () => void
  onOpenEventRecords?: () => void
  mode?: GameMode
  event?: EventDefinition
}

export const RewardsModal = ({
  isOpen,
  handleClose,
  isUppercase,
  onToggleUppercase,
  excludeUrl,
  onToggleExcludeUrl,
  initialTab,
  scrollToAchievement,
  onOpenDeadEndHelp,
  onOpenEventRecords,
  mode,
  event,
}: Props) => {
  const { t } = useTranslation()
  const isEventRewards = mode === 'event'
  const [activeTab, setActiveTab] = useState<RewardsTab>(
    isEventRewards ? 'achievements' : initialTab || 'achievements'
  )
  const [focusedAchievement, setFocusedAchievement] = useState<
    string | undefined
  >(scrollToAchievement)

  useEffect(() => {
    if (!isOpen) return
    setActiveTab(isEventRewards ? 'achievements' : initialTab || 'achievements')
    setFocusedAchievement(scrollToAchievement)
  }, [isOpen, initialTab, scrollToAchievement, isEventRewards, event])

  const eventVersionFilters =
    isEventRewards && event
      ? [normalizeRewardVersion(event.version)]
      : undefined

  const tabs = [
    { id: 'achievements' as const, label: t('achievements') },
    { id: 'cosmetics' as const, label: t('cosmetics') },
  ]

  return (
    <BaseModal
      title={t('rewards')}
      icon={<SparklesIcon />}
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

      <div className="h-[26rem]">
        {activeTab === 'achievements' && (
          <AchievementList
            scrollToId={focusedAchievement}
            onOpenDeadEndHelp={onOpenDeadEndHelp}
            onOpenEventRecords={onOpenEventRecords}
            initialVersionFilters={eventVersionFilters}
            persistFilters={!isEventRewards}
            showFilters
            filterDisplayMode="expanded"
          />
        )}
        {activeTab === 'cosmetics' && (
          <CosmeticsPanel
            isUppercase={isUppercase}
            onToggleUppercase={onToggleUppercase}
            excludeUrl={excludeUrl}
            onToggleExcludeUrl={onToggleExcludeUrl}
            onNavigateToAchievement={(achievementId) => {
              setFocusedAchievement(achievementId)
              setActiveTab('achievements')
            }}
          />
        )}
      </div>
    </BaseModal>
  )
}

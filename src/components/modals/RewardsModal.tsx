import { useEffect, useState } from 'react'
import { SparklesIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { AchievementList } from '../achievements/AchievementList'
import { CosmeticsPanel } from '../rewards/CosmeticsPanel'
import { BaseModal } from './BaseModal'
import { EventDefinition, getKnownEvents } from '../../lib/events'
import { GameMode } from '../../lib/gameMode'
import {
  normalizeRewardVersion,
  RewardMetadataFilter,
} from '../../lib/rewardMetadata'
import { EventVersionPicker } from '../events/EventVersionPicker'

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
  const [selectedEventVersion, setSelectedEventVersion] = useState(
    () => event?.version ?? ''
  )
  const [focusedAchievement, setFocusedAchievement] = useState<
    string | undefined
  >(scrollToAchievement)

  useEffect(() => {
    if (!isOpen) return
    setActiveTab(isEventRewards ? 'achievements' : initialTab || 'achievements')
    setFocusedAchievement(scrollToAchievement)
    if (isEventRewards && event) {
      setSelectedEventVersion(event.version)
    }
  }, [isOpen, initialTab, scrollToAchievement, isEventRewards, event])

  const eventVersions = Array.from(
    new Set([
      ...(event ? [event.version] : []),
      ...getKnownEvents().map((knownEvent) => knownEvent.version),
    ])
  ).sort((a, b) => b.localeCompare(a))
  const selectedVersion =
    selectedEventVersion || event?.version || eventVersions[0] || ''
  const achievementMetadataFilter: RewardMetadataFilter | undefined =
    isEventRewards && selectedVersion
      ? { introducedInVersion: normalizeRewardVersion(selectedVersion) }
      : undefined
  const titleAction =
    isEventRewards && eventVersions.length > 0 ? (
      <EventVersionPicker
        versions={eventVersions}
        selectedVersion={selectedVersion}
        onChange={setSelectedEventVersion}
        fallbackEvent={event}
      />
    ) : undefined

  const tabs = [
    { id: 'achievements' as const, label: t('achievements') },
    ...(isEventRewards
      ? []
      : [{ id: 'cosmetics' as const, label: t('cosmetics') }]),
  ]

  return (
    <BaseModal
      title={t('rewards')}
      titleAction={titleAction}
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
            metadataFilter={achievementMetadataFilter}
          />
        )}
        {!isEventRewards && activeTab === 'cosmetics' && (
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

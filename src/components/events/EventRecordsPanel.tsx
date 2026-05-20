import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { EventDefinition } from '../../lib/events'
import { EventResults } from '../../lib/eventResults'
import { loadAchievementProgress } from '../../lib/achievementProgress'
import {
  CollectedRowsByCollectible,
  getCollectibleProgressItemId,
} from '../../lib/eventCollectibles'
import { Cell } from '../grid/Cell'

type Props = {
  event?: EventDefinition | null
  selectedVersion: string
  currentDateKey: string
  results: EventResults
  isCurrentEvent: boolean
  isGameWon: boolean
  isGameLost: boolean
  collectedRows: CollectedRowsByCollectible
}

const EventGroupTitle = ({
  children,
  separated = false,
}: {
  children: string
  separated?: boolean
}) => (
  <div
    className={`flex items-center justify-between gap-2 pb-1 text-left text-xs font-bold uppercase tracking-wide text-gray-400 ${
      separated ? 'mt-8 border-t border-gray-200 pt-4' : ''
    }`}
  >
    {children}
  </div>
)

const getResultLabel = ({
  t,
  won,
  lost,
}: {
  t: (key: string) => string
  won: boolean
  lost: boolean
}) => {
  if (won) {
    return {
      icon: '😎',
      label: t('playStatsResultWin'),
      status: 'correct' as const,
    }
  }
  if (lost) {
    return {
      icon: '🥲',
      label: t('playStatsResultLose'),
      status: 'present' as const,
    }
  }
  return {
    icon: '😶‍🌫️',
    label: t('playStatsResultYet'),
    status: 'absent' as const,
  }
}

export const EventRecordsPanel = ({
  event,
  selectedVersion,
  currentDateKey,
  results,
  isCurrentEvent,
  isGameWon,
  isGameLost,
  collectedRows,
}: Props) => {
  const { t } = useTranslation()
  const collectible = event?.collectibles?.[0]
  const progressTargets = collectible?.progressTargets ?? {}
  const targetRows = collectible?.targetRows ?? []
  const todayResult = results[currentDateKey]
  const todayWon = isCurrentEvent ? isGameWon : todayResult?.won ?? false
  const todayLost = isCurrentEvent ? isGameLost : todayResult
  const result = getResultLabel({
    t,
    won: todayWon,
    lost: !!todayLost && !todayWon,
  })
  const todayCollectedRows =
    collectible && isCurrentEvent ? collectedRows[collectible.id] ?? [] : []
  const achievementProgress = loadAchievementProgress()
  const collectionProgress = collectible
    ? achievementProgress.collectibles[collectible.collectionId] ?? {}
    : {}
  const maxTarget = Math.max(1, ...Object.values(progressTargets))

  if (!event || !collectible) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm text-gray-400"
        aria-label="Event records panel"
        data-event-id={event?.id ?? ''}
        data-event-version={selectedVersion}
      >
        {t('eventRecordsEmpty')}
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-y-auto pr-1"
      aria-label="Event records panel"
      data-event-id={event.id}
      data-event-version={selectedVersion}
    >
      <section>
        <EventGroupTitle>{t('today')}</EventGroupTitle>
        <div className="grid grid-cols-5 items-end gap-2 pt-1 text-center">
          <div className="m-0.5 min-w-0 text-center">
            <div className="flex h-14 items-center justify-center">
              <Cell value={result.icon} status={result.status} />
            </div>
            <div className="text-[10px] leading-3 text-gray-900">
              {result.label}
            </div>
          </div>
          {targetRows.map((rowIndex) => {
            const collected = todayCollectedRows.includes(rowIndex)
            return (
              <div
                key={rowIndex}
                className="flex min-w-0 flex-col items-center justify-center"
              >
                <Cell value={collected ? collectible.emoji : undefined} />
                <div className="mt-0.5 text-[10px] leading-3 text-gray-900">
                  {t('eventRowLabel', { row: rowIndex + 1 })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <EventGroupTitle separated>{t('eventProgress')}</EventGroupTitle>
        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_3.5rem] gap-x-1.5 gap-y-4 pt-3">
          {targetRows.map((rowIndex) => {
            const itemId = getCollectibleProgressItemId(rowIndex)
            const target = progressTargets[itemId] ?? 1
            const count = collectionProgress[itemId] ?? 0
            const targetWidth = (target / maxTarget) * 100
            const progress = Math.min(1, count / target)
            const isClear = count >= target

            return (
              <Fragment key={rowIndex}>
                <div
                  key={`${rowIndex}-label`}
                  className="flex items-center text-xs font-semibold text-gray-700"
                >
                  {t('eventRowLabel', { row: rowIndex + 1 })}
                </div>
                <div
                  key={`${rowIndex}-bar`}
                  className="flex h-5 min-w-0 items-center"
                >
                  <div
                    className="relative h-3 rounded-full bg-gray-200"
                    style={{ width: `${targetWidth}%` }}
                  >
                    <div
                      className="h-3 rounded-full bg-green-500"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
                <div
                  key={`${rowIndex}-clear`}
                  className="flex items-center justify-center"
                >
                  {isClear && (
                    <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
                      CLEAR!
                    </span>
                  )}
                </div>
                <div
                  key={`${rowIndex}-count`}
                  className="flex items-center justify-end text-xs font-semibold text-gray-700"
                >
                  {count}/{target}
                </div>
              </Fragment>
            )
          })}
        </div>
      </section>
    </div>
  )
}

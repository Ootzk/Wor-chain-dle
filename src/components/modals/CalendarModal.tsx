import { BaseModal } from './BaseModal'
import { CalendarIcon } from '@heroicons/react/outline'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
  gameStats: GameStats
  handleShare: () => void
  weekStartsOnMonday: boolean
  excludeUrl: boolean
}

export const CalendarModal = ({
  isOpen,
  handleClose,
  gameStats,
  handleShare,
  weekStartsOnMonday,
  excludeUrl,
}: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal
      title={t('calendar')}
      icon={<CalendarIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <Calendar
        gameStats={gameStats}
        handleShare={handleShare}
        weekStartsOnMonday={weekStartsOnMonday}
        excludeUrl={excludeUrl}
      />
    </BaseModal>
  )
}

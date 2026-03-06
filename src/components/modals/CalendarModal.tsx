import { BaseModal } from './BaseModal'
import { Calendar } from '../calendar/Calendar'
import { GameStats } from '../../lib/localStorage'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
  gameStats: GameStats
  handleShare: () => void
  weekStartsOnMonday: boolean
  shareWithUrl: boolean
}

export const CalendarModal = ({
  isOpen,
  handleClose,
  gameStats,
  handleShare,
  weekStartsOnMonday,
  shareWithUrl,
}: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal
      title={t('calendar')}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <Calendar
        gameStats={gameStats}
        handleShare={handleShare}
        weekStartsOnMonday={weekStartsOnMonday}
        shareWithUrl={shareWithUrl}
      />
    </BaseModal>
  )
}

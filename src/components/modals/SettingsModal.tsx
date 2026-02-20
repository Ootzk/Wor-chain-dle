import { BaseModal } from './BaseModal'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const SettingsModal = ({ isOpen, handleClose }: Props) => {
  const { t } = useTranslation()
  return (
    <BaseModal title={t('settings')} isOpen={isOpen} handleClose={handleClose}>
      <p className="text-sm text-gray-500">{t('settingsDescription')}</p>
    </BaseModal>
  )
}

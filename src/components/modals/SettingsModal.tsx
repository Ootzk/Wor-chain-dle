import { BaseModal } from './BaseModal'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isUppercase: boolean
  onToggleUppercase: () => void
}

export const SettingsModal = ({
  isOpen,
  handleClose,
  isUppercase,
  onToggleUppercase,
}: Props) => {
  const { t } = useTranslation()
  return (
    <BaseModal title={t('settings')} isOpen={isOpen} handleClose={handleClose}>
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-medium text-gray-700">
          {t('uppercaseLabel')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isUppercase}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isUppercase ? 'bg-green-500' : 'bg-gray-300'
          }`}
          onClick={onToggleUppercase}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isUppercase ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </BaseModal>
  )
}

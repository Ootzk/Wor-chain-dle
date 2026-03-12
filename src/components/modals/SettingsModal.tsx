import { BaseModal } from './BaseModal'
import { CogIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
  isUppercase: boolean
  onToggleUppercase: () => void
  weekStartsOnMonday: boolean
  onToggleWeekStart: () => void
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
}

const Toggle = ({
  checked,
  onClick,
}: {
  checked: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    }`}
    onClick={onClick}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)

export const SettingsModal = ({
  isOpen,
  handleClose,
  isUppercase,
  onToggleUppercase,
  weekStartsOnMonday,
  onToggleWeekStart,
  excludeUrl,
  onToggleExcludeUrl,
}: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal title={t('settings')} icon={<CogIcon />} isOpen={isOpen} handleClose={handleClose}>
      <div className="mt-2">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-700">
            {t('uppercaseLabel')}
          </span>
          <Toggle checked={isUppercase} onClick={onToggleUppercase} />
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-700">
            {t('weekStartLabel')}
          </span>
          <Toggle checked={weekStartsOnMonday} onClick={onToggleWeekStart} />
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-gray-700">
            {t('excludeUrlLabel')}
          </span>
          <Toggle checked={excludeUrl} onClick={onToggleExcludeUrl} />
        </div>
      </div>
    </BaseModal>
  )
}

import { SparklesIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'

const MiniToggle = ({
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

type Props = {
  excludeUrl: boolean
  onToggleExcludeUrl: () => void
  onOpenCosmetics: () => void
}

export const ShareOptionsRow = ({
  excludeUrl,
  onToggleExcludeUrl,
  onOpenCosmetics,
}: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full items-center justify-between text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span>{t('excludeUrlShortLabel')}</span>
        <MiniToggle checked={excludeUrl} onClick={onToggleExcludeUrl} />
      </div>
      <div className="h-5 border-l border-gray-200" />
      <button
        type="button"
        className="text-indigo-600 hover:text-indigo-700"
        aria-label={t('shareAppearanceLabel')}
        title={t('shareAppearanceLabel')}
        onClick={onOpenCosmetics}
      >
        <SparklesIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

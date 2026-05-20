import {
  CREATE_MODE_LABEL,
  GAME_MODE_LABELS,
  GameMode,
} from '../../lib/gameMode'

export type ModeBadgeMode = GameMode | 'create' | 'all'

const MODE_BADGE_BASE_CLASS =
  'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none whitespace-nowrap'

export const MODE_BADGE_CLASSES: Record<ModeBadgeMode, string> = {
  daily: 'bg-gray-50 text-gray-500 border-gray-400',
  practice: 'bg-purple-50 text-purple-500 border-purple-500',
  custom: 'bg-green-50 text-green-500 border-green-500',
  event: 'bg-sky-50 text-sky-500 border-sky-400',
  create: 'bg-green-50 text-green-500 border-green-500',
  all: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export const CORE_ACHIEVEMENT_MODES: GameMode[] = [
  'daily',
  'practice',
  'custom',
]

export const getModeBadgeLabel = (mode: ModeBadgeMode): string => {
  if (mode === 'create') return CREATE_MODE_LABEL
  if (mode === 'all') return 'All'
  return GAME_MODE_LABELS[mode]
}

export const getModeBadgeItems = (
  modes: GameMode[]
): Array<{ id: ModeBadgeMode; label: string }> => {
  const includesAllCoreModes = CORE_ACHIEVEMENT_MODES.every((mode) =>
    modes.includes(mode)
  )

  if (includesAllCoreModes) {
    return [{ id: 'all', label: getModeBadgeLabel('all') }]
  }

  return modes.map((mode) => ({
    id: mode,
    label: getModeBadgeLabel(mode),
  }))
}

export const ModeBadge = ({
  mode,
  label,
  className = '',
}: {
  mode: ModeBadgeMode
  label?: string
  className?: string
}) => (
  <span
    className={`${MODE_BADGE_BASE_CLASS} ${MODE_BADGE_CLASSES[mode]} ${className}`}
  >
    {label ?? getModeBadgeLabel(mode)}
  </span>
)

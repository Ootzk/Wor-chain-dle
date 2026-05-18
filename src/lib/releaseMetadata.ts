export type ReleaseEventMetadata = {
  id: string
  mode: string
  ruleTags: readonly string[]
}

export type ReleaseMetadata = {
  version: string
  theme?: string
  events?: readonly ReleaseEventMetadata[]
}

export const RELEASE_METADATA: Record<string, ReleaseMetadata> = {
  '1.5.0': {
    version: '1.5.0',
    theme: 'core',
  },
  '1.6.0': {
    version: '1.6.0',
    theme: 'recipe',
  },
  '1.7.0': {
    version: '1.7.0',
    theme: 'summer',
    events: [
      {
        id: 'hardcore',
        mode: 'hardcore',
        ruleTags: [
          'forced-word',
          'hidden-letters',
          'hidden-keyboard-status',
          'time-limit',
          'limited-enter',
        ],
      },
    ],
  },
  '1.8.0': {
    version: '1.8.0',
    theme: 'horror',
    events: [
      {
        id: 'ai',
        mode: 'ai',
        ruleTags: [
          'alternating-turns',
          'themed-prefer-word-list',
          'theme-cosmetic-overrides',
        ],
      },
    ],
  },
}

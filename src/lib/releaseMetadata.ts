export type ReleaseEventMetadata = {
  id: string
  mode: string
  ruleTags: readonly string[]
}

export type ReleaseMetadata = {
  version: string
  releasedAt?: string
  theme?: string
  events?: readonly ReleaseEventMetadata[]
}

export const RELEASE_METADATA: Record<string, ReleaseMetadata> = {
  '1.2.0': {
    version: '1.2.0',
    releasedAt: '2026-02-28',
  },
  '1.3.0': {
    version: '1.3.0',
    releasedAt: '2026-03-07',
  },
  '1.4.0': {
    version: '1.4.0',
    releasedAt: '2026-03-12',
  },
  '1.5.0': {
    version: '1.5.0',
    releasedAt: '2026-04-20',
  },
  '1.6.0': {
    version: '1.6.0',
    releasedAt: '2026-05-10',
    theme: 'recipe',
  },
  '1.7.0': {
    version: '1.7.0',
    theme: 'summer garden',
  },
}

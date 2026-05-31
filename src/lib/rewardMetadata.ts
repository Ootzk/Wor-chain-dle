import { RELEASE_METADATA } from './releaseMetadata'

export type RewardMetadata = {
  introducedInVersion: string
}

export type RewardMetadataFilter = {
  introducedInVersion?: string
}

type RewardMetadataCarrier = {
  metadata?: RewardMetadata
}

export const normalizeRewardVersion = (version: string): string =>
  version.replace(/^v/, '')

const parseRewardVersion = (version: string): number[] =>
  normalizeRewardVersion(version)
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0))

export const compareRewardVersionsDesc = (a: string, b: string): number => {
  const left = parseRewardVersion(a)
  const right = parseRewardVersion(b)
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const diff = (right[index] ?? 0) - (left[index] ?? 0)
    if (diff !== 0) return diff
  }

  return normalizeRewardVersion(b).localeCompare(normalizeRewardVersion(a))
}

export const sortRewardVersionsDesc = (versions: string[]): string[] =>
  [...versions].sort(compareRewardVersionsDesc)

export const matchesRewardMetadata = (
  metadata: RewardMetadata | undefined,
  filter: RewardMetadataFilter
): boolean => {
  if (!metadata) {
    return false
  }

  if (
    filter.introducedInVersion &&
    metadata.introducedInVersion !==
      normalizeRewardVersion(filter.introducedInVersion)
  ) {
    return false
  }

  return true
}

export const filterRewardsByMetadata = <T extends RewardMetadataCarrier>(
  rewards: readonly T[],
  filter: RewardMetadataFilter
): T[] =>
  rewards.filter((reward) => matchesRewardMetadata(reward.metadata, filter))

export const getRewardMetadataLabel = (
  metadata: RewardMetadata | undefined
): string => {
  if (!metadata) {
    return ''
  }

  const version = metadata.introducedInVersion
  const theme = RELEASE_METADATA[version]?.theme
  return theme ? `v${version} (${theme})` : `v${version}`
}

export const REWARD_METADATA: Record<
  'v1_5_0' | 'v1_6_0' | 'v1_7_0',
  RewardMetadata
> = {
  v1_5_0: { introducedInVersion: '1.5.0' },
  v1_6_0: { introducedInVersion: '1.6.0' },
  v1_7_0: { introducedInVersion: '1.7.0' },
}

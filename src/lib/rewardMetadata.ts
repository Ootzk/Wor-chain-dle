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

export const matchesRewardMetadata = (
  metadata: RewardMetadata | undefined,
  filter: RewardMetadataFilter
): boolean => {
  if (!metadata) {
    return false
  }

  if (
    filter.introducedInVersion &&
    metadata.introducedInVersion !== filter.introducedInVersion
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

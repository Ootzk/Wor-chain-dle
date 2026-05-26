import type { ComponentType } from 'react'
import type { EventDefinition } from '../../lib/events'
import { SummerGardenEventGuide } from './SummerGardenEventGuide'

const EVENT_GUIDE_BY_VERSION: Partial<Record<string, ComponentType>> = {
  'v1.7.0': SummerGardenEventGuide,
}

type Props = {
  event?: Pick<EventDefinition, 'version'> | null
  version?: string
}

export const EventGuide = ({ event, version }: Props) => {
  const guideVersion = version ?? event?.version
  const Guide = guideVersion ? EVENT_GUIDE_BY_VERSION[guideVersion] : undefined

  return Guide ? <Guide /> : null
}

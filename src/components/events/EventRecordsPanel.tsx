import { EventDefinition } from '../../lib/events'

type Props = {
  event?: EventDefinition | null
  selectedVersion: string
}

export const EventRecordsPanel = ({ event, selectedVersion }: Props) => (
  <div
    className="h-full"
    aria-label="Event records panel"
    data-event-id={event?.id ?? ''}
    data-event-version={selectedVersion}
  />
)

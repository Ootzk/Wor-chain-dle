import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { EventDefinition, getEventByVersion } from '../../lib/events'

type Props = {
  versions: string[]
  selectedVersion: string
  onChange: (version: string) => void
  fallbackEvent?: EventDefinition
}

export const EventVersionPicker = ({
  versions,
  selectedVersion,
  onChange,
  fallbackEvent,
}: Props) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const formatVersion = (version: string) => {
    const event =
      getEventByVersion(version) ||
      (fallbackEvent?.version === version ? fallbackEvent : null)
    return event ? `${version} ${t(event.themeKey)}` : version
  }

  const picker =
    isOpen && versions.length > 0
      ? createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30 px-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-72 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-bold text-gray-900">
                  {t('eventRecordsVersion')}
                </span>
              </div>
              {versions.map((version) => {
                const selected = selectedVersion === version
                return (
                  <button
                    key={version}
                    type="button"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-gray-50 ${
                      selected
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => {
                      onChange(version)
                      setIsOpen(false)
                    }}
                  >
                    <span className="flex-1 truncate text-right">
                      {formatVersion(version)}
                    </span>
                    <span className="w-5 text-center flex-shrink-0">
                      {selected && (
                        <span className="text-indigo-600">{'\u2713'}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        className="w-36 flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 text-sm font-normal text-gray-700"
        onClick={() => setIsOpen(true)}
      >
        <span className="flex min-w-0 items-center justify-between w-full">
          <span className="truncate text-left">
            {formatVersion(selectedVersion)}
          </span>
          <span className="text-xs text-gray-400">{'\u25BE'}</span>
        </span>
      </button>
      {picker}
    </>
  )
}

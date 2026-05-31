import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export type GuessBreakdownRow = {
  row: string
  totalValue: string
  guessValue: string
  pauseValue: string
  enterValue: string
  deleteValue: string
  isSummary?: boolean
}

type Props = {
  rows: GuessBreakdownRow[]
  enterValidationHintUsed: boolean
}

export const GuessBreakdownTable = ({
  rows,
  enterValidationHintUsed,
}: Props) => {
  const { t } = useTranslation()
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  return (
    <div className="relative">
      {isInfoOpen && (
        <div className="absolute left-2 right-2 top-8 z-20 rounded border border-gray-200 bg-white p-3 text-left text-xs shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold text-gray-900">
              {t('playStatsBreakdownInfoTitle')}
            </div>
            <button
              type="button"
              className="font-semibold text-gray-400 hover:text-gray-700"
              onClick={() => setIsInfoOpen(false)}
              aria-label={t('playStatsBreakdownInfoClose')}
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-gray-600">
            <div>
              <p className="font-semibold text-gray-800">
                {t('playStatsBreakdownInfoRowLabel')}
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>{t('playStatsBreakdownInfoRows')}</li>
                <li>{t('playStatsBreakdownInfoBefore')}</li>
                <li>{t('playStatsBreakdownInfoSummary')}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-green-700">
                {t('playStatsBreakdownDurationSeconds')}
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>{t('playStatsBreakdownInfoTotal')}</li>
                <li>{t('playStatsBreakdownInfoGuess')}</li>
                <li>{t('playStatsBreakdownInfoPause')}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-purple-700">
                {t('playStatsBreakdownAction')}
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>{t('playStatsBreakdownInfoEnter')}</li>
                <li>{t('playStatsBreakdownInfoDelete')}</li>
                <li className="text-purple-600">
                  {t('playStatsBreakdownInfoHint')}
                </li>
              </ul>
            </div>
            <p className="border-t border-gray-100 pt-2 text-[11px] text-gray-400">
              {t('playStatsBreakdownInfoPrivacy')}
            </p>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded border border-gray-100 text-[11px] leading-4">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-16" />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead className="font-semibold text-gray-500">
            <tr>
              <th className="border-b border-slate-500 bg-slate-400 px-1.5 py-0.5 text-center text-white">
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  onClick={() => setIsInfoOpen(!isInfoOpen)}
                  aria-label={t('playStatsBreakdownInfoTitle')}
                >
                  ℹ️
                </button>
              </th>
              <th
                colSpan={3}
                className="border-b border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white"
              >
                {t('playStatsBreakdownDurationSeconds')}
              </th>
              <th
                colSpan={2}
                className="border-b border-l border-purple-600 bg-purple-500 px-1.5 py-0.5 text-center text-white"
              >
                {t('playStatsBreakdownAction')}
                {enterValidationHintUsed ? ' ⚠️' : ''}
              </th>
            </tr>
            <tr>
              <th className="bg-slate-400 px-1.5 py-0.5 text-center text-white">
                {t('playStatsBreakdownRow')}
              </th>
              <th className="border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white">
                {t('playStatsBreakdownTotal')}
              </th>
              <th className="border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white">
                {t('playStatsBreakdownGuess')}
              </th>
              <th className="border-l border-green-600 bg-green-500 px-1.5 py-0.5 text-center text-white">
                {t('playStatsBreakdownPause')}
              </th>
              <th className="border-l border-purple-600 bg-purple-500 px-1.5 py-0.5 text-center text-white">
                {t('playStatsBreakdownEnter')}
              </th>
              <th className="border-l border-purple-600 bg-purple-500 px-1.5 py-0.5 text-center text-white">
                {t('playStatsBreakdownDelete')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.row}
                className={`border-t ${
                  row.isSummary
                    ? 'border-gray-200 bg-gray-100 font-semibold'
                    : 'border-gray-100'
                }`}
              >
                <td className="px-1.5 py-0.5 text-gray-500">{row.row}</td>
                <td
                  className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                    row.isSummary ? 'border-gray-200' : 'border-gray-100'
                  }`}
                >
                  {row.totalValue}
                </td>
                <td
                  className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                    row.isSummary ? 'border-gray-200' : 'border-gray-100'
                  }`}
                >
                  {row.guessValue}
                </td>
                <td
                  className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                    row.isSummary ? 'border-gray-200' : 'border-gray-100'
                  }`}
                >
                  {row.pauseValue}
                </td>
                <td
                  className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                    row.isSummary ? 'border-gray-200' : 'border-gray-100'
                  }`}
                >
                  {row.enterValue}
                </td>
                <td
                  className={`border-l px-1.5 py-0.5 text-right text-gray-900 ${
                    row.isSummary ? 'border-gray-200' : 'border-gray-100'
                  }`}
                >
                  {row.deleteValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

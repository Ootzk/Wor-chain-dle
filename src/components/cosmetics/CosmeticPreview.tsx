import { useTranslation } from 'react-i18next'
import {
  CosmeticCategory,
  getShareBadge,
  getShareEmojiSet,
  CELL_FONT_STYLES,
  CELL_COLOR_STYLES,
  ALERT_MESSAGE_KEYS,
  MSG_THEME_EMOJI,
} from '../../lib/cosmetics'

const CHAIN_COLOR_BG: Record<string, string> = {
  chaincolor_black: 'bg-black',
  chaincolor_silver: 'bg-gray-400',
  chaincolor_gold: 'bg-yellow-500',
}

export const CosmeticPreview = ({
  category,
  optionId,
  compact = false,
}: {
  category: CosmeticCategory
  optionId: string
  compact?: boolean
}) => {
  const { t } = useTranslation()

  switch (category) {
    case 'shareEmoji': {
      const s = getShareEmojiSet(optionId)
      return (
        <span>
          {s.correct}
          {s.present}
          {s.absent}
        </span>
      )
    }
    case 'shareBadge': {
      return <span>{getShareBadge(optionId) || '-'}</span>
    }
    case 'cellFont': {
      const fontClass = CELL_FONT_STYLES[optionId] || ''
      return <span className={`${fontClass} font-bold`}>ABC</span>
    }
    case 'cellColor': {
      const colorClass = CELL_COLOR_STYLES[optionId] || ''
      return (
        <span
          className={`inline-block w-5 h-5 rounded ${
            colorClass || 'text-white'
          } bg-green-500 text-center text-xs leading-5 font-bold`}
        >
          A
        </span>
      )
    }
    case 'chainStyle': {
      const borderStyle =
        optionId === 'chain_dashed' ? 'border-dashed' : 'border-solid'
      const borderWidth =
        optionId === 'chain_thick' ? 'border-t-4' : 'border-t-2'
      return (
        <span
          className={`inline-block w-8 ${borderWidth} ${borderStyle} border-black`}
        />
      )
    }
    case 'chainColor': {
      return (
        <span
          className={`inline-block w-4 h-4 rounded-full border border-gray-300 ${
            CHAIN_COLOR_BG[optionId] || 'bg-black'
          }`}
        />
      )
    }
    case 'endMessage': {
      if (compact)
        return <span>{MSG_THEME_EMOJI[optionId] || '\uD83D\uDCD6'}</span>
      const keys = ALERT_MESSAGE_KEYS[optionId]
      const msgs = t(keys?.win || 'winMessages_classic', {
        returnObjects: true,
      })
      const loss = t(keys?.loss || 'lossMessage_classic', { solution: '?' })
      if (!Array.isArray(msgs)) return null
      return (
        <div className="text-xs text-gray-500 space-y-0.5">
          {msgs.map((msg: string, i: number) => (
            <div key={i}>
              <span className="text-gray-400">{i + 1}.</span> {msg}
            </div>
          ))}
          <div>
            <span className="text-gray-400">X.</span> {loss}
          </div>
        </div>
      )
    }
    default:
      return null
  }
}

import { KeyValue } from '../../lib/keyboard'
import { getStatuses } from '../../lib/statuses'
import { Key } from './Key'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

type Props = {
  onChar: (value: string) => void
  onDelete: () => void
  onEnter: () => void
  guesses: string[][]
  solution: string
}

export const Keyboard = ({
  onChar,
  onDelete,
  onEnter,
  guesses,
  solution,
}: Props) => {
  const { t } = useTranslation()
  const charStatuses = getStatuses(guesses, solution)

  const onClick = (value: KeyValue) => {
    if (value === 'ENTER') {
      onEnter()
    } else if (value === 'DELETE') {
      onDelete()
    } else {
      onChar(value)
    }
  }

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        onEnter()
      } else if (e.code === 'Backspace') {
        onDelete()
      } else if (e.code.startsWith('Key')) {
        const key = e.code.slice(3).toLowerCase()
        onChar(key)
      }
    }
    window.addEventListener('keyup', listener)
    return () => {
      window.removeEventListener('keyup', listener)
    }
  }, [onEnter, onDelete, onChar])

  return (
    <div>
      <div className="flex justify-center mb-1">
        {KEYBOARD_ROWS[0].map((char) => (
          <Key
            key={char}
            value={char}
            onClick={onClick}
            status={charStatuses[char]}
          />
        ))}
      </div>
      <div className="flex justify-center mb-1">
        {KEYBOARD_ROWS[1].map((char) => (
          <Key
            key={char}
            value={char}
            onClick={onClick}
            status={charStatuses[char]}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <Key key="enterKey" width={65.4} value="ENTER" onClick={onClick}>
          {t('enterKey')}
        </Key>
        {KEYBOARD_ROWS[2].map((char) => (
          <Key
            key={char}
            value={char}
            onClick={onClick}
            status={charStatuses[char]}
          />
        ))}
        <Key key="deleteKey" width={65.4} value="DELETE" onClick={onClick}>
          {t('deleteKey')}
        </Key>
      </div>
    </div>
  )
}

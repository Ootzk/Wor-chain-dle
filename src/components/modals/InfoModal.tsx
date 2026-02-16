import { Cell } from '../grid/Cell'
import { ChainBridge } from '../grid/ChainBridge'
import { BaseModal } from './BaseModal'
import { CONFIG } from '../../constants/config'
import { useTranslation } from 'react-i18next'
import 'i18next'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

interface Letter {
  letter: string
  highlight: boolean
}

export const InfoModal = ({ isOpen, handleClose }: Props) => {
  const { t } = useTranslation()
  const firstExampleWord: Letter[] = t('firstExampleWord', {
    returnObjects: true,
  })
  const secondExampleWord: Letter[] = t('secondExampleWord', {
    returnObjects: true,
  })
  const thirdExampleWord: Letter[] = t('thirdExampleWord', {
    returnObjects: true,
  })
  return (
    <BaseModal title={t('howToPlay')} isOpen={isOpen} handleClose={handleClose}>
      <p className="text-sm text-gray-500">
        {t('instructions', { tries: CONFIG.tries })}
      </p>

      <div className="flex justify-center mb-1 mt-4">
        {Array.isArray(firstExampleWord) &&
          firstExampleWord.map((el: Letter) => {
            if (el.highlight) {
              return <Cell key={el.letter} value={el.letter} status="correct" />
            } else {
              return <Cell key={el.letter} value={el.letter} />
            }
          })}
      </div>
      <p className="text-sm text-gray-500">{t('correctSpotInstructions')}</p>
      <div className="flex justify-center mb-1 mt-4">
        {Array.isArray(secondExampleWord) &&
          secondExampleWord.map((el) => {
            if (el.highlight) {
              return <Cell key={el.letter} value={el.letter} status="present" />
            } else {
              return <Cell key={el.letter} value={el.letter} />
            }
          })}
      </div>
      <p className="text-sm text-gray-500">{t('wrongSpotInstructions')}</p>

      <div className="flex justify-center mb-1 mt-4">
        {Array.isArray(thirdExampleWord) &&
          thirdExampleWord.map((el) => {
            if (el.highlight) {
              return <Cell key={el.letter} value={el.letter} status="absent" />
            } else {
              return <Cell key={el.letter} value={el.letter} />
            }
          })}
      </div>
      <p className="text-sm text-gray-500">{t('notInWordInstructions')}</p>

      <hr className="my-4 border-gray-300" />

      <h4 className="text-md font-bold text-gray-900 mb-2">
        {t('chainRuleTitle')}
      </h4>
      <p className="text-sm text-gray-500">{t('chainRuleInstructions')}</p>

      <div className="flex justify-center mb-1 mt-4">
        {'CHAIN'.split('').map((letter, i) => (
          <Cell
            key={i}
            value={letter}
            status={i === 4 ? 'correct' : 'absent'}
            chainBottom={i === CONFIG.wordLength - 1}
          />
        ))}
      </div>
      <ChainBridge chainIndex={CONFIG.wordLength - 1} />
      <div className="flex justify-center mb-1">
        {Array.from(Array(CONFIG.wordLength)).map((_, i) => (
          <Cell
            key={i}
            value={i === CONFIG.wordLength - 1 ? 'N' : undefined}
            status={i === CONFIG.wordLength - 1 ? 'correct' : undefined}
            isLocked={i === CONFIG.wordLength - 1}
            chainTop={i === CONFIG.wordLength - 1}
          />
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-2">
        {t('chainPatternInstructions')}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        ⚠️ {t('chainDeadEndInstructions')}
      </p>
    </BaseModal>
  )
}

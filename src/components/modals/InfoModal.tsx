import { Cell } from '../grid/Cell'
import { ChainBridge } from '../grid/ChainBridge'
import { BaseModal } from './BaseModal'
import { CONFIG } from '../../constants/config'
import { Trans, useTranslation } from 'react-i18next'
import 'i18next'

type GameMode = 'daily' | 'practice' | 'custom' | 'create'

type Props = {
  isOpen: boolean
  handleClose: () => void
  mode: GameMode
}

interface Letter {
  letter: string
  highlight: boolean
}

const ModeSection = ({
  title,
  description,
  warning,
}: {
  title: string
  description: string
  warning?: string
}) => (
  <>
    <hr className="my-4 border-gray-300" />
    <h4 className="text-md font-bold text-gray-900 mb-2">{title}</h4>
    <p className="text-sm text-gray-500 whitespace-pre-line">{description}</p>
    {warning && (
      <p className="text-sm text-amber-600 mt-2">⚠️ {warning}</p>
    )}
  </>
)

const GamePlayContent = () => {
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
    <>
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
    </>
  )
}

const AboutSection = () => {
  const { t } = useTranslation()
  return (
    <>
      <hr className="my-4 border-gray-300" />
      <h4 className="text-md font-bold text-gray-900 mb-2">{t('about')}</h4>
      <p className="text-sm text-gray-500">
        <Trans
          i18nKey="aboutAuthorSentence"
          values={{ language: CONFIG.language, author: CONFIG.author }}
        >
          This is an open source word guessing game adapted to
          {CONFIG.language} by
          <a href={CONFIG.authorWebsite} className="underline font-bold">
            {CONFIG.author}
          </a>{' '}
        </Trans>
        <Trans i18nKey="aboutCodeSentence">
          Have a look at
          <a
            href="https://github.com/roedoejet/AnyLanguage-Word-Guessing-Game"
            className="underline font-bold"
          >
            Aidan Pine's fork
          </a>
          and customize it for another language!
        </Trans>
        <Trans
          i18nKey="aboutDataSentence"
          values={{ wordListSource: CONFIG.wordListSource }}
        >
          The words for this game were sourced from
          <a href={CONFIG.wordListSourceLink} className="underline font-bold">
            {CONFIG.wordListSource}
          </a>
          .
        </Trans>
        <Trans i18nKey="aboutOriginalSentence">
          You can also
          <a
            href="https://www.powerlanguage.co.uk/wordle/"
            className="underline font-bold"
          >
            play the original here
          </a>
        </Trans>
      </p>
    </>
  )
}

const CreateContent = () => {
  const { t } = useTranslation()
  return (
    <p className="text-sm text-gray-500 whitespace-pre-line">
      {t('createModeDesc', { length: CONFIG.wordLength })}
    </p>
  )
}

export const InfoModal = ({ isOpen, handleClose, mode }: Props) => {
  const { t } = useTranslation()

  const isCreate = mode === 'create'
  const title = isCreate ? t('howToCreate') : t('howToPlay')

  return (
    <BaseModal title={title} isOpen={isOpen} handleClose={handleClose}>
      {isCreate ? (
        <CreateContent />
      ) : (
        <>
          <GamePlayContent />

          {mode === 'daily' && (
            <>
              <ModeSection
                title={t('dailyModeTitle')}
                description={t('dailyModeDesc')}
              />
              <AboutSection />
            </>
          )}

          {mode === 'practice' && (
            <ModeSection
              title={t('practiceModeTitle')}
              description={t('practiceModeDesc')}
              warning={t('practiceModeWarning')}
            />
          )}

          {mode === 'custom' && (
            <ModeSection
              title={t('customModeTitle')}
              description={t('customModeDesc')}
            />
          )}
        </>
      )}
    </BaseModal>
  )
}

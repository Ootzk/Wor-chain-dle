import { useTranslation } from 'react-i18next'

const EVENT_RULE_KEYS = [
  'eventSummerGardenRuleStart',
  'eventSummerGardenRuleTiming',
  'eventSummerGardenRuleHide',
  'eventSummerGardenRuleGameOver',
  'eventSummerGardenRuleClover',
  'eventSummerGardenRuleRabbit',
] as const

export const SummerGardenEventGuide = () => {
  const { t } = useTranslation()

  return (
    <section className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-left">
      <h4 className="text-sm font-bold text-green-700">
        {t('eventSummerGardenInfoTitle')}
      </h4>
      <p className="mt-2 text-sm text-gray-600">
        {t('eventSummerGardenInfoIntro')}
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-600">
        {EVENT_RULE_KEYS.map((ruleKey) => (
          <li key={ruleKey}>{t(ruleKey)}</li>
        ))}
      </ul>
    </section>
  )
}

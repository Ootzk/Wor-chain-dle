import { useState } from 'react'
import { BaseModal } from './BaseModal'
import { useTranslation } from 'react-i18next'
import {
  KAKAOPAY_PAYMENT_URL,
  TOSS_PAYMENT_URL,
} from '../../constants/config'

type Tab = {
  id: string
  label: string
}

const TABS: Tab[] = [
  { id: 'kakaopay', label: 'KakaoPay' },
  { id: 'toss', label: 'Toss' },
  // { id: 'github', label: 'GitHub Sponsors' },
]

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const DonateModal = ({ isOpen, handleClose }: Props) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  return (
    <BaseModal title={t('donate')} isOpen={isOpen} handleClose={handleClose}>
      {TABS.length > 1 && (
        <div className="flex border-b border-gray-200 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[280px]">
        {activeTab === 'kakaopay' && (
          <div className="flex flex-col items-center">
            <img
              src={process.env.PUBLIC_URL + '/images/kakaopay-qr.png'}
              alt="KakaoPay QR"
              className="w-48 mb-3"
            />
            <a
              href={KAKAOPAY_PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 mb-3 text-base font-medium rounded-md text-gray-900 bg-yellow-400 hover:bg-yellow-500 shadow-sm focus:outline-none"
            >
              {t('donateKakaoPay')}
            </a>
            <p className="text-sm font-medium text-gray-700">
              {t('donateMonsterDrink')}
            </p>
          </div>
        )}

        {activeTab === 'toss' && (
          <div className="flex flex-col items-center">
            <img
              src={process.env.PUBLIC_URL + '/images/toss-qr.jpg'}
              alt="Toss QR"
              className="w-48 mb-3"
            />
            <a
              href={TOSS_PAYMENT_URL}
              className="inline-flex items-center px-6 py-3 mb-3 text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 shadow-sm focus:outline-none"
            >
              {t('donateToss')}
            </a>
            <p className="text-sm font-medium text-gray-700">
              {t('donateMonsterDrink')}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

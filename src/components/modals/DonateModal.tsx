import { useState } from 'react'
import { BaseModal } from './BaseModal'
import { useTranslation } from 'react-i18next'

type Tab = {
  id: string
  label: string
}

const TABS: Tab[] = [
  { id: 'kakaopay', label: 'KakaoPay' },
  // { id: 'github', label: 'GitHub Sponsors' },
  // { id: 'toss', label: 'Toss Pay' },
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

      {activeTab === 'kakaopay' && (
        <div className="flex flex-col items-center">
          <img
            src={process.env.PUBLIC_URL + '/images/kakaopay-qr.png'}
            alt="KakaoPay QR"
            className="w-48 mb-3"
          />
          <p className="text-sm font-medium text-gray-700">
            {t('donateMonsterDrink')}
          </p>
        </div>
      )}
    </BaseModal>
  )
}

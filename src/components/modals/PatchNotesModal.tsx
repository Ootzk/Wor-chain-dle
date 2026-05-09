import { BaseModal } from './BaseModal'
import { SparklesIcon } from '@heroicons/react/outline'
import { useTranslation } from 'react-i18next'
import { PatchNotesContent } from './PatchNotesContent'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const PatchNotesModal = ({ isOpen, handleClose }: Props) => {
  const { t } = useTranslation()

  return (
    <BaseModal
      title={t('patchNotesTitle')}
      icon={<SparklesIcon />}
      isOpen={isOpen}
      handleClose={handleClose}
    >
      <PatchNotesContent />
    </BaseModal>
  )
}

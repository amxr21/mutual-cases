'use client'
import Link from 'next/link'

import { Line } from './index'
import { useI18n } from '../i18n/I18nProvider'

function CopyRights() {
  const { t } = useI18n()
  return (
    <div className='w-full flex flex-col items-center '>
        <Line classes="border-t border-t-gray-400 pt-3 min-w-20 w-2/12" />

        <div className='text-center flex gap-5 justify-center text-xs font-light'>
            <Link href={'mailto:support@mutualcovers.ae'}>support@mutualcovers.ae</Link>
            <p className=''>{t('footer.established')}</p>
        </div>
    </div>
  )
}

export default CopyRights
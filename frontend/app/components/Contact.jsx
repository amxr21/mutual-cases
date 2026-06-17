'use client'
import React from 'react'
import { FooterSection, FollowUs } from './index'
import PaymentMethods from './PaymentMethods'
import { useI18n } from '../i18n/I18nProvider'

function Contact() {
  const { t } = useI18n()
  return (
    <FooterSection classes={'flex-col gap-6'} header={t('footer.contact')}>
        <div className='flex flex-col gap-2'>
            <h4 className='text-xl'>{t('footer.contactUs')}</h4>
            <p className='para-small'>{t('footer.contactBlurb')}</p>
        </div>
        <FollowUs />

        <PaymentMethods />

    </FooterSection>
  )
}

export default Contact
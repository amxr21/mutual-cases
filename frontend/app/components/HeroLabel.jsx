'use client'
import React from 'react'
import { useI18n } from '../i18n/I18nProvider'

function HeroLabel() {
  const { t } = useI18n()
  return (
    <div className='label-large bg-blue text-off-white px-2 py-1 rounded-lg w-fit'>{t('home.heroLabel')}</div>
  )
}

export default HeroLabel;
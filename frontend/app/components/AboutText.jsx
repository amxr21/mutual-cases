'use client'
import React from 'react'
import { BoldText, Header, Mark } from '.'
import { useI18n } from '../i18n/I18nProvider'


function AboutText() {
  const { t } = useI18n()
  return (
    <div className="about-text flex flex-col gap-5">
      <Header headerText={t('home.aboutHeader')} subheader={false} textAlignment='left' mark={true} markClasses='-top-8 left-0 w-40'/>

      <div>
        <p className='para'>
            {t('home.aboutP1a')} <BoldText>{t('home.aboutP1creators')}</BoldText> {t('home.aboutP1and')} <BoldText>{t('home.aboutP1doers')}</BoldText> {t('home.aboutP1b')}
        </p>

        <br />

        <p className="para">
          {t('home.aboutP2a')} <BoldText>{t('home.aboutP2brand')}</BoldText> {t('home.aboutP2b')}
        </p>

        <br />

        <p className='para'>{t('home.aboutP3a')} <BoldText>{t('home.aboutP3style')}</BoldText></p>
      </div>


    </div>
  )
}

export default AboutText
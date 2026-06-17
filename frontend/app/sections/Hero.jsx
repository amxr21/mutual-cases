'use client'
import React from 'react'
import { HeroLabel, ImagesSlider, EmiratiBadge, Stars, Mark, MainSection } from '../components';
import { useI18n } from '../i18n/I18nProvider'

function Hero() {
  const { t } = useI18n()
  return (
    <MainSection Id={"Hero"} classes='relative items-center py-6 gap-6'>
      <HeroLabel />


      <div className='relative flex flex-col text-center items-center gap-8 xl:gap-4 mb-12'>
        <EmiratiBadge />
        <h1 className='heading'>{t('home.heroTitle')}</h1>
        <p className='para italic'>{t('home.heroTagline')}</p>
        <Mark />
      </div>

      <Stars />
      


      <ImagesSlider />
    </MainSection>
  )
}

export default Hero;
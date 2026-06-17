'use client'
import React from 'react'
import { Header } from '../components';
import Step from '../components/Step';

import { step1, step2, step3, step4 } from "../constants/imags"
import { MainSection } from '.';
import { useI18n } from '../i18n/I18nProvider'

const images = [step1, step2, step3, step4]



function Steps() {
  const { t } = useI18n()
  return (
    <MainSection classes={'gap-8 xl:gap-0'}>
        <Header headerText={t('home.stepsHeader')} subheader={true} subheaderText={t('home.stepsSub')} textAlignment='center' mark={true} markClasses='grow w-40 flex justify-center -top-6 right-[35%]' textColor='' />

        <div className='flex flex-col gap-8 xl:gap-15'>
            {
                images.map((image, index) => {
                    return (
                        <Step key={index} classes={index % 2 ? 'xl:flex-row' : 'xl:flex-row-reverse'} header={t(`home.step.${index}.h`)} paragraph={t(`home.step.${index}.p`)} imageSrc={image} />
                    )
                })
            }
        </div>

    </MainSection>
  )
}

export default Steps
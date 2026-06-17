'use client'
import { MainSection, Header, Info } from '../components'

import { HeartIcon, BoxIcon, AimIcon } from '../constants/icons'
import { useI18n } from '../i18n/I18nProvider'

function Unique() {
    const { t } = useI18n()

    const icons = [AimIcon, BoxIcon, HeartIcon]


  return (
    <MainSection Id={"Unique"} classes="banner gap-8 xl:gap-0 -mx-8 xl:-mx-20 px-10 xl:px-20 py-6 py-12 mb-20 xl:mb-40">
        <Header headerText={t('home.uniqueHeader')} subheader={true} subheaderText={t('home.uniqueSub')} textAlignment='center' textColor='white' />

        <div className="info's grid xl:grid-cols-3 gap-10 xl:gap-2">
            {
                icons.map((icon, indx) => {
                    return (
                        <Info key={indx} icon={icon} header={t(`home.unique.${indx}.h`)} description={t(`home.unique.${indx}.p`)} />
                    )
                })
            }
        </div>
    </MainSection>
  )
}

export default Unique
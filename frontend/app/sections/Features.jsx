'use client'
import { Header, Feature, MainSection } from "../components/index"
import { useI18n } from '../i18n/I18nProvider'


function Features() {
    const { t } = useI18n()

    // Each type maps to its translated display name + its (translated) feature
    // list. Counts mirror the dictionary keys (magnet/simple: 5, light: 4).
    const types = [
        { name: t('home.feat.name.magnet'), key: 'magnet', count: 5 },
        { name: t('home.feat.name.simple'), key: 'simple', count: 5 },
        { name: t('home.feat.name.light'), key: 'light', count: 4 },
    ]


  return (
    <MainSection Id="Features" classes="banner items-center bg-blue gap-8 xl:gap-0 px-8 xl:px-20 py-8 xl:py-16 -mx-8 xl:-mx-20 text-white">
        <Header textColor="white" textAlignment="center" headerText={t('home.featuresHeader')} subheaderText={t('home.featuresSub')} subheader={true} mark={false} />
        <ul className="features-details grid grid-cols-1 gap-5 xl:grid-cols-3 w-full justify-between">
            {
                types.map((type, indx) => {
                    const details = Array.from({ length: type.count }, (_, i) => t(`home.feat.${type.key}.${i}`))
                    return (
                        <Feature key={type.key} index={indx+1} header={type.name} details={details} />
                    )
                })
            }
        </ul>

    </MainSection>
  )
}

export default Features
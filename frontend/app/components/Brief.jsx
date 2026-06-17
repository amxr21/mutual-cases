'use client'
import Image from "next/image"
import Logo from "../../public/images/logo.png"

import { FooterSection } from "./index"
import { useI18n } from '../i18n/I18nProvider'

function Brief() {
  const { t } = useI18n()
  return (
    <FooterSection classes={'flex-col'}>
      <Image src={Logo} alt=""  className="mb-4"/>
      <p className="para-small">{t('footer.brief')}</p>
    </FooterSection>
  )
}

export default Brief
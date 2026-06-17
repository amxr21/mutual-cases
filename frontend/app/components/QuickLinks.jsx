'use client'
import React from 'react'
import { FooterSection, QuickLinksList } from './index'
import { useI18n } from '../i18n/I18nProvider'

function QuickLinks() {
    const { t } = useI18n()

    const aboutLinks = [
        {link: "/about", text: t('footer.link.about')},
        {link: "/order-journey", text: t('footer.link.journey')},
        {link: "/privacy-policy", text: t('footer.link.privacy')},
        {link: "/terms", text: t('footer.link.terms')},
        {link: "/why-us", text: t('footer.link.whyUs')},
    ]
    const quickLinks = [
        {link: "/products", text: t('footer.link.ipad')},
        {link: "/products", text: t('footer.link.iphone')},
        {link: "/products", text: t('footer.link.special')},
        {link: "/custom-it", text: t('footer.link.customize')},
        {link: "/cart", text: t('footer.link.whereOrder')},
    ]


  return (
    <FooterSection classes={'gap-12'}>
        <QuickLinksList header={t('footer.about')} links={aboutLinks} />
        <QuickLinksList header={t('footer.quickLinks')} links={quickLinks} />
    </FooterSection>
  )
}

export default QuickLinks
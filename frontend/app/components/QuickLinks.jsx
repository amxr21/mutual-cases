import React from 'react'
import { FooterSection, QuickLinksList } from './index'

function QuickLinks() {
    


    const links = {
        'en': [
            [
                {link: "/", text: 'What is Mutual?'},
                {link: "/", text: 'Order Journey'},
                {link: "/", text: 'Privacy Policy'},
                {link: "/", text: 'Terms & Conditions'},
                {link: "/", text: 'Why Us?'},
            ],
            [
                {link: "/", text: 'iPad Cases'},
                {link: "/", text: 'iPhone Cases'},
                {link: "/", text: 'Special Items'},
                {link: "/", text: 'Customize It'},
                {link: "/", text: "Where's my Order?"},
            ],
        ]
    }


  return (
    <FooterSection classes={'gap-12'}>
        <QuickLinksList header='About' links={links['en'][0]} />
        <QuickLinksList header='Quick Links' links={links['en'][1]} />
    </FooterSection>
  )
}

export default QuickLinks
import React from 'react'
import { FooterSection, QuickLinksList } from './index'

function QuickLinks() {
    


    const links = {
        'en': [
            [
                {link: "/about", text: 'What is Mutual?'},
                {link: "/order-journey", text: 'Order Journey'},
                {link: "/privacy-policy", text: 'Privacy Policy'},
                {link: "/terms", text: 'Terms & Conditions'},
                {link: "/why-us", text: 'Why Us?'},
            ],
            [
                {link: "/products", text: 'iPad Cases'},
                {link: "/products", text: 'iPhone Cases'},
                {link: "/products", text: 'Special Items'},
                {link: "/custom-it", text: 'Customize It'},
                {link: "/cart", text: "Where's my Order?"},
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
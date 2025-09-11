import Image from 'next/image'
import React from 'react'

import { Logo } from '../constants/imags'
import { NavContainer, NavLink } from '../components'
import GoogleLoginButton from '../components/GoogleLoginButton'

function Navbar() {
    const links = {
        en: [
            { type : "text", text: 'Home', link: "/" },    
            { type : "text", text: 'Cases & More', link: "/products" },
            { type : "text", text: 'Custom It', link: "/custom-it" },
            { type : "text", text: 'About Us', link: "/about" },
            { type : "icon", text: 'cart', link: "/cart" },
            { type : "icon", text: 'liked', link: "/liked" },
        ],
    }


  return (
    <nav className='flex w-full justify-between items-center my-8'>
        <div className="logo h-8">
            <Image className='h-full w-auto' src={Logo} alt='test' quality={100} />
        </div>
        <div className="links w-fit flex gap-x-8">
            <NavContainer type='text'>
                {
                    links['en'].filter(l => l.type === 'text').map(link => {
                        return <NavLink key={link.link} text={link.text} link={link.link} type={link.type} />
                    })
                }
            </NavContainer>

            <NavContainer type='icon'>
                {
                    links['en'].filter(l => l.type === 'icon').map(link => {
                        return <NavLink key={link.link} text={link.text} link={link.link} type={link.type} />
                    })
                }
            </NavContainer>
            <GoogleLoginButton />
        </div>
    </nav>
  )
}

export default Navbar;
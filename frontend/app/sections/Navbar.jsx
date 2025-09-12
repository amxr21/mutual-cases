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
    <nav className='flex flex-col xl:flex-row w-full justify-between items-center my-8 overflow-hidden'>
        <div className="logo h-8">
            <Image className='h-full w-auto' src={Logo} alt='test' quality={100} />
        </div>

        <div className="links w-full items-end justify-baseline xl:w-fit flex xl:flex-row flex-col-reverse gap-4 xl:gap-x-8">
            <NavContainer type='text' classes="w-full">
                {
                    links['en'].filter(l => l.type === 'text').map(link => {
                        return <NavLink key={link.link} text={link.text} link={link.link} type={link.type} />
                    })
                }
            </NavContainer>

            <div className="flex  xl:flex-row-reverse flex-row w-full xl:w-fit justify-between -mt-8 md:mt-0">
                <GoogleLoginButton />
                <NavContainer type='icon' classes="">
                    {
                        links['en'].filter(l => l.type === 'icon').map(link => {
                            return <NavLink key={link.link} text={link.text} link={link.link} type={link.type} />
                        })
                    }
                </NavContainer>

            </div>

        </div>
    </nav>
  )
}

export default Navbar;
import Link from 'next/link';
import React from 'react'
import { CartBtn, LikedBtn } from '.';

function NavLink({text = '', link, type = 'text'}) {
  return type == 'text'
  ? <Link href={link} className='nav-link' >{text}</Link>
  : text == 'liked'
    ? <LikedBtn />
    : <CartBtn />
}

export default NavLink;
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Scratches } from './constants/imags'

export default function NotFound() {
  return (
    <div className='text-blue flex flex-col items-center py-30 text-center relative'>
        <p className='text-[14rem] leading-40 mb-12'>404</p>
        <p className='text-5xl font-semibold'>Oops... something wrong happened</p>
        
        <p className='my-4 font-light z-50'>Go Back to <Link className='underline cursor-pointer' href={'/'}>Homepage</Link></p>
        <Image src={Scratches} alt='scratches' className='absolute w-[50%] top-0' />

    </div>
  )
}

// export default NotFound;
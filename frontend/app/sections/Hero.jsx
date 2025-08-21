import React from 'react'
import { HeroLabel, ImagesSlider, EmiratiBadge, Stars, Mark } from '../components';

function Hero() {
  return (
    <div className='relative flex flex-col items-center py-6 gap-6'>
        <HeroLabel />

        <EmiratiBadge />

        <div className='relative flex flex-col items-center gap-4 mb-12'>
          <h1 className='heading'>More than just a Cover</h1>
          <p className='para italic'>Crafted for iPads, iPhones, and pens — built for your lifestyle.</p>
          <Mark />
        </div>

        <Stars />
        


        <ImagesSlider />


    </div>
  )
}

export default Hero;
import React from 'react'
import Image from 'next/image'



function ImageContainer({ imageSrc, pos }) {
  let width = 
   pos == 0 ? '15.5rem' 
  :pos == 1 ? '10rem'
  :pos == 2 ? '15rem'
  :pos == 3 ? '14rem'
  :pos == 4 ? '15.5rem'
  :pos == 5 ? '10rem'
  :pos == 6 ? '15rem'
  :pos == 7 ? '14rem'
  :pos == 8 ? '15.5rem'
  :pos == 9 ? '10rem'
  :pos == 10 ? '15rem' : '15.5rem'


  return (
    <div style={{width}} className='relative image-container bg-light-blue rounded-lg h-64 overflow-hidden'>
        <Image src={imageSrc} alt='' className='absolute inset-0 w-full h-full object-cover' />
    </div>
  )
}

export default ImageContainer
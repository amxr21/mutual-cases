import Image from 'next/image'
import React from 'react'

function Label({ text, emoji='' }) {
  return (
    <div className='absolute top-3 left-3 rounded-md flex items-center gap-1.5 bg-blue text-off-white px-2 py-0.5 h-fit w-fit'>
        <p className='label-large'>{text}</p>
        {
            emoji != '' &&  <Image alt='stars emoji' className='h-full max-h-5 w-auto' src={emoji} />
        }
    </div>
  )
}

export default Label
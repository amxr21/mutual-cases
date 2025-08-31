import Image from 'next/image'
import React from 'react'

function ShippingFeature({text, icon}) {
  return (
    <div className='flex items-center  gap-4'>
        <div className="icon rounded-[20px] border border-blue p-3 w-12 h-12">
            <Image src={icon} alt={text} className='w-full h-full' />
        </div>
        <p className="feature-text font-light text-blue w-32">{text}</p>
    </div>
  )
}

export default ShippingFeature
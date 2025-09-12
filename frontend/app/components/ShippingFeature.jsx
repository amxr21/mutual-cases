import Image from 'next/image'
import React from 'react'

function ShippingFeature({text, icon}) {
  return (
    <div className='flex items-center  gap-4'>
        <div className="icon rounded-xl xl:rounded-[20px] border border-blue p-2 xl:p-3 min-w-10 w-10 xl:min-w-12 xl:w-12 min-h-10 h-10 xl:min-h-12 xl:h-12">
            <Image src={icon} alt={text} className='w-full h-full' />
        </div>
        <p className="feature-text font-light text-blue w-32">{text}</p>
    </div>
  )
}

export default ShippingFeature
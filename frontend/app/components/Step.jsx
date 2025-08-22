import Image from 'next/image'
import React from 'react'

function Step({header, paragraph, imageSrc, classes}) {
  return (
    <div className={`step flex ${classes} gap-5 w-full overflow-hidden`}>
        <div className="relative step-image bg-gray-400 rounded-lg grow min-w-1/2 w-1/2 h-42 overflow-hidden">
            <Image   className='w-full h-full inset-0 absolute object-cover' src={imageSrc} alt="step-image" />
        </div>
        <div className="step-text grow py-2">
            <h2 className='text-3xl font-semibold uppercase'>{header}</h2>
            <p className='text-lg font-light text-justify'>{paragraph}</p>
        </div>
    </div>
  )
}

export default Step
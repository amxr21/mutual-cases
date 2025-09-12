import Image from 'next/image'
import React from 'react'

import { iPhoneDrawing ,iPadDrawing } from '../constants/imags'
import { ImageCaption } from './index'

function AboutImage() {
  return (
    <div className="about-image flex gap-8 xl:gap-18 min-w-fit">
        <ImageCaption caseType="iphone" />
        <ImageCaption caseType="ipad" />
    </div>
  )
}

export default AboutImage
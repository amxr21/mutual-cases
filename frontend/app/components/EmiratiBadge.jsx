import React from 'react'
import Image from "next/image"

import { emiratiBadge } from "../constants/imags"

function EmiratiBadge() {
  return (
    <div className='absolute top-8 -left-[4rem] -rotate-12 z-50'>
        <Image alt='proudly made by Emirati talents' src={emiratiBadge}  />
    </div>
  )
}

export default EmiratiBadge
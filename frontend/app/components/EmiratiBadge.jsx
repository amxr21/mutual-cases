import React from 'react'
import Image from "next/image"

import { emiratiBadge } from "../constants/imags"

function EmiratiBadge() {
  return (
    <div className='absolute left-[-6%] top-[20%] xl:w-fit xl:top-8 xl:-left-[4rem] -rotate-12 z-50'>
        <Image alt='proudly made by Emirati talents' src={emiratiBadge}  />
    </div>
  )
}

export default EmiratiBadge
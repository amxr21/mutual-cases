import React from 'react'
import Image from "next/image"

import { emiratiBadge } from "../constants/imags"

function EmiratiBadge() {
  return (
    <div className='absolute top-28 left-72 -rotate-12 z-50'>
        <Image src={emiratiBadge}  />
    </div>
  )
}

export default EmiratiBadge
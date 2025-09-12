import React from 'react'
import { Brief, Contact, CopyRights, Line, QuickLinks } from '../components'

function Footer() {
  return (
    <div className='px-10 xl:px-20 py-5 flex flex-col gap-5 xl:gap-10 justify-between items-center overflow-hidden'>
        
        <Line classes="border-t border-t-gray-400 pt-2 w-7/12" />

        <div className="flex flex-col xl:flex-row gap-5 w-full ">
            <Brief />
            <QuickLinks />
            <Contact />
        </div>

        <CopyRights />

    </div>
  )
}

export default Footer
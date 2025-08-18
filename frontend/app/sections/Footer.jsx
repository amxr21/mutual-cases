import React from 'react'
import { Brief, Contact, CopyRights, Line, QuickLinks } from '../components'

function Footer() {
  return (
    <div className='my-20 px-20 py-5 flex flex-col gap-10 justify-between items-center'>
        
        <Line classes="border-t border-t-gray-400 pt-2 w-7/12" />

        <div className="flex gap-5 w-full ">
            <Brief />
            <QuickLinks />
            <Contact />
        </div>

        <CopyRights />

    </div>
  )
}

export default Footer
import React from 'react'
import Filter from './Filter'
import { Button, RemoveFilters } from '.'

let devices = 
    {
        iPhone: ["iPhone 12","iPhone 13","iPhone 14","iPhone 15",],
        iPad: ['Simple', 'Light', 'Magnet'],
        // iPad: ['Simple (Starting from AED110)', 'Light (Starting from AED140)', 'Magnet (Starting from AED160)'],
        "Special Items": ["Stickers", "Seasonal"],
    }



function Filters() {
  return (
    <div className='col-span-2 flex flex-col gap-6'>

        <div className='flex pb-2 border-b border-gray-500 h-10 items-center justify-between'>
            <h2 className='font-semibold '>Filters</h2>
            <RemoveFilters />
        </div>

        <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-6">
                {
                    Object.entries(devices).map((device, indx) => {
                        return <Filter key={indx} device={device[0]} models={device[1]} />
                        
                    })
                }

            </div>
        </div>
    

    </div>
  )
}

export default Filters
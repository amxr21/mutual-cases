import React from 'react'

function WarrantyFeature({ header, para }) {
  return (
    <div className='flex flex-col'>
        <h2 className='text-2xl font-semibold'>{header}</h2>
        <p className='text-base font-light'>{para}</p>
    </div>
  )
}

export default WarrantyFeature
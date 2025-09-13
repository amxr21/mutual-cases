import React from 'react'

function CaretItemPrice({ item }) {
  return (
    <div className="price flex flex-col gap-2 ">
        <h2 className='text-3xl xl:text-[2.5rem] leading-8  w-fit min-w-48'>{item.price} AED</h2>
        <p className='text-sm text-off-black opacity-40'>Including VAT</p>
    </div>
  )
}

export default CaretItemPrice
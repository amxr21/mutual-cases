import React from 'react'

/**
 * Cart line title/subtitle. Guards against missing item fields so a partial
 * item renders cleanly instead of "undefined undefined".
 */
function CartItemHeader({ item }) {
  const category = item?.category ?? ''
  const model = item?.model ?? ''
  const isSpecial = category === 'special items'

  return (
    <div className="item-detials w-full">
      <h2 className='text-3xl xl:text-4xl'>
        {`${category} ${model} ${isSpecial ? '' : 'Case'}`.replace(/\s+/g, ' ').trim()}
      </h2>
      <p className='text-lg xl:text-xl font-light capitalize'>{item?.edition ?? ''}</p>
    </div>
  )
}

export default CartItemHeader

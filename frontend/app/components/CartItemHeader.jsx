import React from 'react'

function CartItemHeader({ item }) {
  return (
    <div className="item-detials w-full">
        <h2 className='text-3xl xl:text-4xl'>{`${item.category} ${item.model} ${item.category != 'special items' ? 'Case' : ''} `}</h2>
        <p className='text-lg xl:text-xl font-light capitalize'>{item.edition}</p>
    </div>  )
}

export default CartItemHeader
import React from 'react'

function CartItemHeader({ item }) {
  return (
    <div className="item-detials">
        <h2 className='text-4xl'>{`${item.category} ${item.model} ${item.category != 'special items' ? 'Case' : ''} `}</h2>
        <p className='text-xl font-light capitalize'>{item.edition}</p>
    </div>  )
}

export default CartItemHeader
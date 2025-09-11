'use client'
import { useState } from 'react';
import { CartItemQuantity } from '.'

function ProductDetailsHeader({ details }) {
  const [ count, setCount ] = useState(5);

  return (
    <div className="main-header  flex justify-between items-center">
      <div className="flex flex-col ">
        <h1 className="text-5xl">{`${details?.category || 'category'} ${details?.model || 'model'}`} Case</h1>
        <h4 className="text-3xl font-light capitalize">{details?.edition || 'edition'}</h4>
      </div>
      {/* <div className=''>
        <CartItemQuantity count={count} countFunc={setCount} remove={false} />
      </div> */}

    </div>
  )
}

export default ProductDetailsHeader
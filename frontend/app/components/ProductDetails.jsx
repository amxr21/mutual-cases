import React from 'react'
import { ProductHeader, ProductPrice, ProductRate } from './index'
import product from '../(main)/products/[id]/page'

// {
//     "id": 10,
//     "trend": true,
//     "edition": "uaq edition",
//     "category": "ipad",
//     "model": "m1",
//     "type": "magnet",
//     "price": 110,
//     "stock_quantity_id": 46888,
//     "quantity": 10,
//     "image_url_1": null,
//     "image_url_2": null,
//     "image_url_3": null,
//     "created_at": "2025-08-17T18:16:39.000Z",
//     "updated_at": "2025-08-17T18:16:39.000Z"
//   },

function ProductDetails( { data }) {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex gap-4'>
          <ProductHeader header={`${String(data.edition).toUpperCase()}`} subheader={`${data.category} ${data.model}`} />
          <ProductRate />
      </div>

      <ProductPrice price={data.price} />

    </div>
  )
}

export default ProductDetails
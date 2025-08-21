import React from 'react'
import { ProductDetails, ProductImage } from './index'

// {
//     "id": 10,
//     "trend": true,
//     "category": "ipad",
//     "model": "m1",
//     "type": "magnet",
//     "price": 110,
//     "stock_quantity_id": 46888,
//     "quantity": 10,
//     "created_at": "2025-08-17T18:16:39.000Z",
//     "updated_at": "2025-08-17T18:16:39.000Z"
//   }



function Product({ details }) {
  return (
    <div className='w-full flex flex-col gap-3 '>
        <ProductImage trend={details?.trend} imageUrl = {details?.image_url_1} />
        <ProductDetails data = { details } />
    </div>
  )
}

export default Product
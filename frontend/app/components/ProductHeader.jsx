import React from 'react'

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

function ProductHeader({ header, subheader }) {
  return (
    <div className='w-11/12 '>
      <div className='flex justify-between'>
        <p className="product-category nav-link">{header}</p>
      </div>
      <p className="product-header header">{subheader}</p>
    </div>
  )
}

export default ProductHeader
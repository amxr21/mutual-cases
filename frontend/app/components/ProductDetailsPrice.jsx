import React from 'react'

function ProductDetailsPrice({ details }) {
  return (
    <div className="price flex gap-3 items-end">
        <h2 className="text-5xl">{details.price} AED</h2>
        <p className="text-xl text-off-black opacity-20 font-base">including VAT</p>
    </div>
  )
}

export default ProductDetailsPrice
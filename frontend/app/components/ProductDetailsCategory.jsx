import React from 'react'

function ProductDetailsCategory({ details }) {
  return (
    <div className="category flex gap-2 min-w-28 xl:min-w-36 px-3 py-1 rounded-lg bg-blue text-off-white w-fit">
        <h4 className="font-light text-sm xl:text-base">Category: </h4>
        <h4 className="category font-semibold text-sm xl:text-base">{details.category == 'ipad' ? 'iPad' : details.category == 'iphone' ? 'iPhone' : ''} Cases</h4>
    </div>
  )
}

export default ProductDetailsCategory
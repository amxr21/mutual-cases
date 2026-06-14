"use client"
import MiniAddToCart from './MiniAddToCart'

function ProductPrice({ price = 0, id }) {
  return (
    <div className='flex w-full justify-between items-center gap-2 pt-0.5 border-t border-black'>
        <div className="price product-price">{price} AED</div>
        {id ? <MiniAddToCart id={id} /> : null}
    </div>
  )
}

export default ProductPrice

"use client"
import { Button } from '.'

function ProductPrice({ price = 0 }) {
  return (
    <div className='flex w-full justify-between pt-2 border-t border-black'>
        <div className="price product-price">{price} AED</div>
        <Button classes="add-to-cart" buttonContent='add to card' handleClick={() => {}} type='text' />
    </div>
  )
}

export default ProductPrice
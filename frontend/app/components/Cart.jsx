'use client'
import { CartContextWrapper } from '../Context/CartContext'
import { CartItems, OrderOptions, Total } from '.'

function CartSection() {
  return (
    <>
        <CartContextWrapper>
            <div className="cart-items flex flex-col items-end gap-4">
            <CartItems/>

            <OrderOptions />
            </div>

            <Total />
            
        </CartContextWrapper>
    </>
  )
}

export default CartSection
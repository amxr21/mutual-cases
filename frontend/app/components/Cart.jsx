'use client'
import { CartItems, OrderOptions, Total } from '.'
import { useCart } from '../Context/CartContext'

/**
 * Cart page section. Order options (gift/note) and the Total only render when
 * there's at least one item — an empty cart shows just the empty message.
 * The cart context is provided globally in the root layout.
 */
function CartSection() {
  const { items, hydrated } = useCart()
  const hasItems = hydrated && items.length > 0

  return (
    <>
      <div className="cart-items flex flex-col items-end gap-4">
        <CartItems />
        {hasItems ? <OrderOptions /> : null}
      </div>

      {hasItems ? <Total /> : null}
    </>
  )
}

export default CartSection

'use client'
import { QuantityCounter, RemoveItemBtn } from '.'
import { useCart } from '../Context/CartContext'

/**
 * Cart-line quantity control. Uses the shared QuantityCounter wired to the
 * global cart by product_id (consistent with add/remove). Setting quantity to 0
 * removes the line. A separate Remove button is also offered.
 */
function CartItemQuantity({ productId, quantity, remove = true }) {
  const { setQuantity } = useCart()

  return (
    <div className="up quantity flex flex-col gap-2 justify-between min-w-28 items-end">
      <QuantityCounter
        value={quantity}
        onChange={(next) => setQuantity(productId, next)}
        min={0}
      />
      {remove ? <RemoveItemBtn productId={productId} /> : null}
    </div>
  )
}

export default CartItemQuantity

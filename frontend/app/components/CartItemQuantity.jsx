'use client'
import { Dropdown } from 'primereact/dropdown';
import { RemoveItemBtn } from '.';
import { useContext, useEffect, useRef } from 'react';
import { CartContext } from '../Context/CartContext';
import { patchJSON } from '../lib/safeFetch';

/**
 * Quantity selector for a cart line. Hardened:
 *  - the PATCH now runs through safeFetch with its try/catch INSIDE the async
 *    fn (the original wrapped the inner async call, so it never caught
 *    rejections), and is skipped on the initial mount so we don't fire a
 *    needless update when the row first renders.
 *  - cart context update guards that cartItems is an array before mapping.
 */
function CartItemQuantity({ count, countFunc, remove = true, itemId }) {
  const { setCartDetails } = useContext(CartContext)
  const isFirstRun = useRef(true)

  useEffect(() => {
    // Skip the update request on initial mount.
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const updateCartItem = async () => {
      // safeFetch never throws; errors are reported centrally.
      await patchJSON('/cart', { id: itemId, quantity: count })
    }

    updateCartItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const handleChange = (e) => {
    const value = e.target.value
    countFunc(value)
    setCartDetails((prev) => ({
      ...prev,
      cartItems: Array.isArray(prev.cartItems)
        ? prev.cartItems.map((item) => (item.id == itemId ? { ...item, quantity: value } : item))
        : prev.cartItems,
    }))
  }

  return (
    <div className="up quantity flex flex-col gap-1 justify-between min-w-28">
      <Dropdown
        value={count}
        onChange={handleChange}
        className="w-full bg-off-white text-off-black py-1 px-2 rounded-md flex gap-4 h-full items-center up"
        options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        panelClassName='px-2 py-1 bg-off-white text-off-black mt-1 border-off-black rounded-md up'
        placeholder="1"
      />
      {remove ? <RemoveItemBtn itemId={itemId} func={() => countFunc(0)} /> : null}
    </div>
  )
}

export default CartItemQuantity

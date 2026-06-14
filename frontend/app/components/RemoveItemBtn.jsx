'use client'
import { Button } from '.';
import { useCart } from '../Context/CartContext';

/**
 * Remove-from-cart button (Task 2 fix).
 *
 * Removes by product_id through the global cart — previously the UI passed the
 * cart-line id (ci.id) as if it were product_id, so the backend's
 * "DELETE ... WHERE product_id = ?" matched nothing and threw "item not in
 * cart". Keying everything on product_id resolves it, and removal is optimistic
 * + isolated to this one line.
 */
function RemoveItemBtn({ productId }) {
    const { removeFromCart } = useCart()

    return (
        <Button
            type='text'
            buttonContent='✕ Remove'
            classes={'bg-transparent h-full px-2 py-1 text-sm text-off-black/60 hover:text-blue transition-colors'}
            handleClick={() => removeFromCart(productId)}
        />
    )
}

export default RemoveItemBtn

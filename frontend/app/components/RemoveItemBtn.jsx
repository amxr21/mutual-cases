'use client'
import { Button } from '.';
import { deleteJSON } from '../lib/safeFetch';
import { useToast } from './Toast/ToastProvider';

/**
 * Remove-from-cart button. Hardened:
 *  - request via safeFetch (timeout + consistent result); the optimistic UI
 *    removal (func()) only runs after a successful delete, so a failed request
 *    no longer hides an item that's still in the cart.
 *  - the cart-badge decrement DOM access is null-guarded.
 *  - uses themed toasts instead of alert().
 */
function RemoveItemBtn({ func, itemId }) {
    const toast = useToast()

    const removeItem = async () => {
        const result = await deleteJSON(`/cart/${itemId}`, { product_id: itemId })

        if (!result.ok) {
            toast.error(result.error?.message || "Couldn't remove the item. Please try again.")
            return
        }

        // Optimistically clear this line in the parent.
        if (typeof func === 'function') func()

        // Best-effort badge decrement — guard the DOM nodes.
        const badge = document.getElementById("Cart")?.lastElementChild
        if (badge) {
            const current = parseInt(badge.innerText, 10)
            if (Number.isFinite(current) && current > 1) {
                badge.innerText = String(current - 1)
            }
        }
    }

    return (
        <Button
            type='text'
            buttonContent='X | Remove'
            classes={'bg-transparent h-full px-2 py-1 down'}
            handleClick={removeItem}
        />
    )
}

export default RemoveItemBtn

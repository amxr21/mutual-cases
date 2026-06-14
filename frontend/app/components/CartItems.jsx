'use client'
import { CartItem } from "."
import { useCart } from "../Context/CartContext"

/**
 * Renders the signed-in user's cart lines from the global cart context. No local
 * fetch — the CartProvider owns hydration and keeps everything in sync.
 */
function CartItems() {
    const { items, hydrated } = useCart()

    const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('userId')

    if (!isLoggedIn) return <p className="font-light w-full">Please log in to view your cart.</p>
    if (!hydrated) return <p className="font-light w-full">Loading your cart…</p>
    if (items.length === 0) return <p className="font-light w-full">Your cart is empty.</p>

    return (
        <>
            {items.map((item) => (
                <CartItem key={item.product_id ?? item.id} itemDetails={item} />
            ))}
        </>
    )
}

export default CartItems

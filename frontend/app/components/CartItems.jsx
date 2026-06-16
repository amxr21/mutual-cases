'use client'
import { CartItem, EmptyState } from "."
import { useCart } from "../Context/CartContext"

/**
 * Renders the signed-in user's cart lines from the global cart context. No local
 * fetch — the CartProvider owns hydration and keeps everything in sync.
 */
function CartItems() {
    const { items, hydrated } = useCart()

    const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('userId')

    if (!isLoggedIn)
        return (
            <EmptyState
                icon="lock"
                title="Please log in to view your cart"
                message="Sign in to see the items you've added and continue to checkout."
                action={{ label: 'Go to homepage', href: '/' }}
            />
        )
    if (!hydrated) return <p className="font-light w-full">Loading your cart…</p>
    if (items.length === 0)
        return (
            <EmptyState
                icon="cart"
                title="Your cart is empty"
                message="Browse our cases and add something you love."
                action={{ label: 'Shop cases', href: '/products' }}
            />
        )

    return (
        <>
            {items.map((item) => (
                <CartItem key={item.product_id ?? item.id} itemDetails={item} />
            ))}
        </>
    )
}

export default CartItems

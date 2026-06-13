'use client'
import { useContext, useEffect, useState } from "react"
import { CartItem } from "."
import { CartContext } from "../Context/CartContext"
import { getJSON } from "../lib/safeFetch"

/**
 * Fetches and renders the signed-in user's cart items. Uses safeFetch and only
 * ever stores an array into state, so .map can't throw. Shows empty/error text
 * instead of crashing when there's no user or the request fails.
 */
function CartItems() {
    const { setCartDetails } = useContext(CartContext)

    const [items, setItems] = useState([])
    const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error' | 'empty'

    useEffect(() => {
        let active = true
        const userId = localStorage.getItem('userId')

        if (!userId) {
            setStatus('empty')
            return
        }

        const getCartItems = async () => {
            const result = await getJSON(`/cart/${userId}`)
            if (!active) return

            if (result.ok && Array.isArray(result.data)) {
                setItems(result.data)
                setCartDetails((prev) => ({ ...prev, cartItems: result.data }))
                setStatus(result.data.length ? 'ready' : 'empty')
            } else {
                setItems([])
                setStatus('error')
            }
        }

        getCartItems()
        return () => {
            active = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (status === 'loading') return <p className="font-light w-full">Loading your cart…</p>
    if (status === 'error')
        return <p className="font-light w-full text-blue">We couldn&apos;t load your cart. Please refresh.</p>
    if (status === 'empty') return <p className="font-light w-full">Your cart is empty.</p>

    return (
        <>
            {items.map((item, indx) => (
                <CartItem key={item?.id ?? indx} itemDetails={item} />
            ))}
        </>
    )
}

export default CartItems

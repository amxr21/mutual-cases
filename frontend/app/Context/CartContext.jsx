'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getJSON, postJSON, patchJSON, deleteJSON } from '../lib/safeFetch'
import { useToast } from '../components/Toast/ToastProvider'

/**
 * Global cart state. Holds the user's cart lines, the gift/note "requests", and
 * exposes operations (add, setQuantity, remove) that talk to the backend and
 * stay in sync everywhere the cart appears (cards, detail page, nav badge,
 * cart page, checkout).
 *
 * Cart lines are keyed by product_id (cart_items.product_id is unique per the
 * schema), which is also how the backend keys every cart operation — this is
 * the fix for the earlier remove/quantity id mismatch.
 *
 * The gift/note requests persist across navigation via localStorage so they
 * survive through to checkout.
 */
const CartContext = createContext(null)

const REQUESTS_KEY = 'mutual_cart_requests'
const loadRequests = () => {
    if (typeof window === 'undefined') return { gift: false, giftMessage: '', note: '' }
    try {
        const raw = localStorage.getItem(REQUESTS_KEY)
        return raw ? { gift: false, giftMessage: '', note: '', ...JSON.parse(raw) } : { gift: false, giftMessage: '', note: '' }
    } catch {
        return { gift: false, giftMessage: '', note: '' }
    }
}

export function CartProvider({ children }) {
    const toast = useToast()
    const [items, setItems] = useState([])
    const [requests, setRequests] = useState({ gift: false, giftMessage: '', note: '' })
    const [hydrated, setHydrated] = useState(false)

    const getUserId = () => (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)

    // Hydrate cart + requests on mount.
    useEffect(() => {
        setRequests(loadRequests())
        const userId = getUserId()
        if (!userId) {
            setHydrated(true)
            return
        }
        let active = true
        ;(async () => {
            const result = await getJSON(`/cart/${userId}`)
            if (!active) return
            if (result.ok && Array.isArray(result.data)) setItems(result.data)
            setHydrated(true)
        })()
        return () => {
            active = false
        }
    }, [])

    // Persist requests whenever they change.
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
        } catch {
            /* ignore quota errors */
        }
    }, [requests])

    const refresh = useCallback(async () => {
        const userId = getUserId()
        if (!userId) return
        const result = await getJSON(`/cart/${userId}`)
        if (result.ok && Array.isArray(result.data)) setItems(result.data)
    }, [])

    /** Quantity currently in cart for a product (0 if absent). */
    const quantityOf = useCallback(
        (productId) => {
            const line = items.find((it) => Number(it.product_id) === Number(productId))
            return line ? Number(line.quantity) : 0
        },
        [items]
    )

    /** Add (or increment by `amount`) a product in the cart. */
    const addToCart = useCallback(
        async (productId, amount = 1) => {
            const userId = getUserId()
            if (!userId) {
                toast.info('Please log in first to add items to your cart')
                return false
            }

            const result = await postJSON('/cart', {
                user_id: userId,
                product_id: productId,
                quantity: amount,
            })
            if (!result.ok) {
                toast.error(result.error?.message || "Couldn't add the item to your cart")
                return false
            }
            await refresh()
            // Customer-facing confirmation with a quick way to jump to the cart.
            toast.success(
                result.data?.itemStatus === 'incremented' ? 'Cart updated' : 'Added to your cart',
                { title: '🛒 In your cart', action: { label: 'Check Cart', href: '/cart' } }
            )
            return true
        },
        [refresh, toast]
    )

    /** Set an absolute quantity for a product (0 removes the line). */
    const setQuantity = useCallback(
        async (productId, quantity) => {
            const userId = getUserId()
            if (!userId) return false
            const q = Math.max(0, Number(quantity) || 0)

            // Optimistic update.
            setItems((prev) =>
                q === 0
                    ? prev.filter((it) => Number(it.product_id) !== Number(productId))
                    : prev.map((it) =>
                          Number(it.product_id) === Number(productId) ? { ...it, quantity: q } : it
                      )
            )

            const result = await patchJSON('/cart', { id: productId, quantity: q })
            if (!result.ok) {
                await refresh() // roll back to server truth
                toast.error(result.error?.message || "Couldn't update the cart")
                return false
            }
            return true
        },
        [refresh, toast]
    )

    /** Remove a product line entirely (keyed by product_id — the real fix). */
    const removeFromCart = useCallback(
        async (productId) => {
            // Optimistic removal.
            setItems((prev) => prev.filter((it) => Number(it.product_id) !== Number(productId)))

            const result = await deleteJSON(`/cart/${productId}`, { product_id: productId })
            if (!result.ok) {
                await refresh()
                toast.error(result.error?.message || "Couldn't remove the item")
                return false
            }
            toast.success('Removed from your cart')
            return true
        },
        [refresh, toast]
    )

    const setNote = useCallback((note) => setRequests((r) => ({ ...r, note })), [])
    const setGift = useCallback((gift) => setRequests((r) => ({ ...r, gift })), [])

    /** Clear cart + order requests locally (after a confirmed order). */
    const clearCart = useCallback(() => {
        setItems([])
        setRequests({ gift: false, giftMessage: '', note: '' })
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(REQUESTS_KEY)
            } catch {
                /* ignore */
            }
        }
    }, [])

    const totals = useMemo(() => {
        const count = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0)
        const price = items.reduce(
            (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
            0
        )
        return { count, price, lines: items.length }
    }, [items])

    const value = useMemo(
        () => ({
            items,
            requests,
            hydrated,
            totals,
            quantityOf,
            addToCart,
            setQuantity,
            removeFromCart,
            setNote,
            setGift,
            clearCart,
            refresh,
        }),
        [items, requests, hydrated, totals, quantityOf, addToCart, setQuantity, removeFromCart, setNote, setGift, clearCart, refresh]
    )

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (ctx) return ctx
    return {
        items: [],
        requests: { gift: false, giftMessage: '', note: '' },
        hydrated: false,
        totals: { count: 0, price: 0, lines: 0 },
        quantityOf: () => 0,
        addToCart: () => false,
        setQuantity: () => false,
        removeFromCart: () => false,
        setNote: () => {},
        setGift: () => {},
        clearCart: () => {},
        refresh: () => {},
    }
}

// Back-compat exports (old code imported these names).
export const CartContextWrapper = CartProvider
export { CartContext }
export default CartContext

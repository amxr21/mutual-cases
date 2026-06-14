'use client'
import { useState } from 'react'
import { useCart } from '../Context/CartContext'

/**
 * Compact add-to-cart control shown next to the price on product cards.
 * - Not in cart: a small round "+ cart" button that adds 1.
 * - In cart: a tiny – qty + stepper, synced to the global cart.
 * Stops link navigation (cards are wrapped in a <Link>).
 */
export default function MiniAddToCart({ id }) {
    const { quantityOf, addToCart, setQuantity } = useCart()
    const [busy, setBusy] = useState(false)
    const qty = quantityOf(id)

    const stop = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const add = async (e) => {
        stop(e)
        if (busy || !id) return
        setBusy(true)
        await addToCart(id, 1)
        setBusy(false)
    }

    const change = async (e, next) => {
        stop(e)
        if (busy || !id) return
        setBusy(true)
        await setQuantity(id, next)
        setBusy(false)
    }

    if (qty > 0) {
        return (
            <div className="flex items-center h-8 rounded-lg border border-blue/40 bg-blue/5 overflow-hidden shrink-0">
                <button
                    type="button"
                    onClick={(e) => change(e, qty - 1)}
                    aria-label="Decrease"
                    className="w-7 h-full flex items-center justify-center text-blue hover:bg-blue hover:text-off-white transition-colors active:scale-90 text-lg cursor-pointer"
                >
                    –
                </button>
                <span className="min-w-6 text-center text-sm font-semibold text-blue tabular-nums">{qty}</span>
                <button
                    type="button"
                    onClick={(e) => change(e, qty + 1)}
                    aria-label="Increase"
                    className="w-7 h-full flex items-center justify-center text-blue hover:bg-blue hover:text-off-white transition-colors active:scale-90 text-lg cursor-pointer"
                >
                    +
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={add}
            disabled={busy}
            aria-label="Add to cart"
            title="Add to cart"
            className="shrink-0 w-8 h-8 rounded-lg bg-blue text-off-white flex items-center justify-center transition-all duration-200 hover:brightness-110 active:scale-90 disabled:opacity-60 cursor-pointer"
        >
            <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" />
            </svg>
        </button>
    )
}

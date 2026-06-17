'use client'
import { useState } from "react"
import { LargeButton, QuantityCounter } from "."
import { useCart } from "../Context/CartContext"
import { useI18n } from "../i18n/I18nProvider"

/**
 * Add-to-cart control (Task 1).
 *
 * - If the product isn't in the cart: shows an "Add to Cart" button that adds 1.
 * - Once in the cart: shows a synced – / + counter. Clicking + (or Add to Cart
 *   repeatedly) increments the quantity; the value reflects the global cart, so
 *   it stays in sync on the card, the detail page, the nav badge, and the cart.
 *
 * Setting the counter to 0 removes the line.
 */
function AddToCart({ id }) {
    const { quantityOf, addToCart, setQuantity } = useCart()
    const { t } = useI18n()
    const [busy, setBusy] = useState(false)

    const qty = quantityOf(id)

    const handleAdd = async () => {
        if (busy || !id) return
        setBusy(true)
        await addToCart(id, 1)
        setBusy(false)
    }

    const handleChange = async (next) => {
        if (busy || !id) return
        setBusy(true)
        await setQuantity(id, next)
        setBusy(false)
    }

    if (qty > 0) {
        // Match the LargeButton footprint exactly: same width, padding, radius,
        // and font sizing so it occupies the identical space as "Add To Cart".
        return (
            <div className="w-full flex items-center justify-between rounded-xl border border-blue bg-blue/5 px-2 xl:px-3 py-1 xl:py-2">
                <span className="text-lg xl:text-2xl font-semibold text-blue">{t('cart.inCart', 'In cart')}</span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleChange(qty - 1)}
                        disabled={busy}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 xl:w-9 xl:h-9 rounded-lg flex items-center justify-center text-blue hover:bg-blue hover:text-off-white transition-colors active:scale-90 text-xl cursor-pointer disabled:opacity-40"
                    >
                        –
                    </button>
                    <span className="min-w-8 text-center text-lg xl:text-2xl font-semibold text-blue tabular-nums">{qty}</span>
                    <button
                        type="button"
                        onClick={() => handleChange(qty + 1)}
                        disabled={busy}
                        aria-label="Increase quantity"
                        className="w-8 h-8 xl:w-9 xl:h-9 rounded-lg flex items-center justify-center text-blue hover:bg-blue hover:text-off-white transition-colors active:scale-90 text-xl cursor-pointer disabled:opacity-40"
                    >
                        +
                    </button>
                </div>
            </div>
        )
    }

    return (
        <LargeButton
            key={'Add To Cart'}
            handleClick={handleAdd}
            text={busy ? t('common.loading', 'Adding…') : t('common.add', 'Add To Cart')}
            color="blue"
            classes="w-full transition-all duration-300"
        />
    )
}

export default AddToCart

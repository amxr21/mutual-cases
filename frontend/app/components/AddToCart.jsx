'use client'
import { useState } from "react"
import { LargeButton } from "."
import { postJSON } from "../lib/safeFetch"
import { useToast } from "./Toast/ToastProvider"

/**
 * Add-to-cart button. Interactive states (idle → adding → added) with themed
 * toasts instead of alert(). Guards the optimistic cart-badge DOM update.
 */
function AddToCart({ id }) {
    const toast = useToast()
    const [state, setState] = useState('idle') // 'idle' | 'loading' | 'added'

    const cartRequest = async () => {
        if (state === 'loading') return

        const userId = localStorage.getItem('userId')
        if (!userId) {
            toast.info("Please log in first to add items to your cart")
            return
        }

        setState('loading')
        const result = await postJSON('/cart', {
            user_id: userId,
            product_id: id,
            quantity: 1,
        })

        if (!result.ok) {
            setState('idle')
            toast.error(result.error?.message || "Couldn't add the item to your cart")
            return
        }

        if (result.data?.itemStatus === 'added') {
            const badge = document.getElementById('Cart')?.lastElementChild
            if (badge) {
                const current = parseInt(badge.innerText, 10)
                badge.innerText = String((Number.isFinite(current) ? current : 0) + 1)
            }
            setState('added')
            toast.success("Added to your cart")
            // Return to idle after the success state has been shown.
            setTimeout(() => setState('idle'), 1800)
        } else if (result.data?.itemStatus === 'exists') {
            setState('idle')
            toast.info("This item is already in your cart")
        }
    }

    const text = state === 'loading' ? 'Adding…' : state === 'added' ? '✓ Added!' : 'Add To Cart'

    return (
        <LargeButton
            key={'Add To Cart'}
            handleClick={cartRequest}
            text={text}
            color="blue"
            classes={`w-full transition-all duration-300 ${state === 'added' ? 'scale-[1.02]' : ''}`}
        />
    )
}

export default AddToCart

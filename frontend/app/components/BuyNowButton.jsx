'use client'
import { useRouter } from 'next/navigation'
import { LargeButton } from '.'

/**
 * "Buy Now" — Amazon-style express checkout for a single product.
 *
 * Skips the cart entirely: navigates straight to the checkout/payment page in
 * "buy now" mode (?buynow=<id>), where only this product is ordered. The
 * customer's existing cart is left untouched. Logged-out visitors still go to
 * checkout; the place-order step there prompts for sign-in.
 */
export default function BuyNowButton({ id }) {
    const router = useRouter()
    const go = () => {
        if (!id) return
        router.push(`/checkout?buynow=${encodeURIComponent(id)}`)
    }
    return (
        <LargeButton key={'Buy Now'} handleClick={go} text="Buy Now" color="white" classes="w-full" />
    )
}

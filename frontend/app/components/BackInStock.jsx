'use client'
import { useState } from 'react'
import { postJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'

/**
 * Out-of-stock product control: instead of "Add to cart", lets the customer
 * subscribe their email to be notified when the product is back in stock.
 * Posts to /products/:id/notify-stock (public).
 */
export default function BackInStock({ productId }) {
    const toast = useToast()
    const [email, setEmail] = useState('')
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        if (!email.trim()) { toast.error('Enter your email'); return }
        setBusy(true)
        const r = await postJSON(`/products/${productId}/notify-stock`, { email: email.trim() })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || "Couldn't subscribe"); return }
        setDone(true)
        toast.success("We'll email you when it's back")
    }

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="w-full rounded-xl border border-gold bg-gold/5 px-3 py-2.5 flex items-center gap-2">
                <span className="text-lg font-semibold text-gold">Out of stock</span>
            </div>
            {done ? (
                <p className="text-sm font-light text-off-black/70">You&apos;re on the list — we&apos;ll email you when it&apos;s back.</p>
            ) : (
                <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email me when available"
                        className="grow bg-off-white border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-blue transition-colors"
                    />
                    <button type="submit" disabled={busy} className="bg-blue text-off-white font-semibold px-5 py-2.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60 whitespace-nowrap">
                        {busy ? 'Saving…' : 'Notify me'}
                    </button>
                </form>
            )}
        </div>
    )
}

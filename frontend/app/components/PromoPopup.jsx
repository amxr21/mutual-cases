'use client'
import { useEffect, useState } from 'react'
import { getJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'

/**
 * One-time exclusive-coupon popup for the storefront.
 *
 * Shows the best featured discount in a dismissible modal when a visitor lands
 * on the products page, then suppresses itself for ~7 days (localStorage), so a
 * returning shopper isn't nagged on every visit. Renders nothing when there are
 * no featured codes or when it was shown within the cooldown window.
 *
 * Distinct from <PromoBanner/> (the always-on inline strip): this is the
 * occasional "exclusive coupon" nudge.
 */
const STORAGE_KEY = 'mutual_promo_popup_seen'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function describe(d) {
    return d.type === 'percent' ? `${Number(d.value)}% OFF`
        : d.type === 'fixed' ? `${Number(d.value)} AED OFF`
        : 'FREE SHIPPING'
}

export default function PromoPopup() {
    const toast = useToast()
    const [promo, setPromo] = useState(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Respect the weekly cooldown before doing anything else.
        let lastSeen = 0
        try { lastSeen = Number(localStorage.getItem(STORAGE_KEY)) || 0 } catch { /* ignore */ }
        if (Date.now() - lastSeen < COOLDOWN_MS) return

        let active = true
        ;(async () => {
            const r = await getJSON('/discounts/featured')
            if (!active || !r.ok || !Array.isArray(r.data) || !r.data.length) return
            setPromo(r.data[0])
            setOpen(true)
            // Mark as shown now so it won't reappear for a week, even within this session.
            try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
        })()
        return () => { active = false }
    }, [])

    if (!open || !promo) return null

    const close = () => setOpen(false)
    const copy = () => {
        try { navigator.clipboard.writeText(promo.code); toast.success(`Copied ${promo.code}`) } catch { /* ignore */ }
    }
    const expiry = promo.expires_at ? new Date(promo.expires_at) : null

    return (
        <div
            className="fixed inset-0 z-[1000000] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Exclusive offer"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-off-black/50 backdrop-blur-sm" onClick={close} />

            {/* Card */}
            <div className="relative w-full max-w-sm rounded-2xl bg-off-white shadow-2xl overflow-hidden">
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute top-3 right-3 text-off-white/80 hover:text-off-white z-10"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-blue to-light-blue text-off-white px-6 pt-8 pb-6 text-center">
                    <p className="text-sm font-light tracking-widest uppercase opacity-90">Exclusive offer</p>
                    <p className="text-4xl font-bold mt-1">{describe(promo)}</p>
                    {Number(promo.min_spend) > 0 ? (
                        <p className="text-sm font-light mt-1 opacity-90">on orders over {Number(promo.min_spend)} AED</p>
                    ) : null}
                </div>

                {/* Body */}
                <div className="px-6 py-6 flex flex-col items-center gap-4 text-center">
                    <p className="font-light text-off-black/70">Use this code at checkout{promo.first_order_only ? ' on your first order' : ''}:</p>
                    <button
                        onClick={copy}
                        title="Copy code"
                        className="font-mono font-bold text-lg tracking-wider border-2 border-dashed border-blue/40 rounded-lg px-6 py-2 hover:bg-blue/5 transition-colors"
                    >
                        {promo.code}
                    </button>
                    {expiry ? <p className="text-xs text-off-black/50">Ends {expiry.toLocaleDateString()}</p> : null}
                    <button
                        onClick={close}
                        className="w-full bg-blue text-off-white font-semibold py-2.5 rounded-lg hover:brightness-110 transition-all mt-1"
                    >
                        Start shopping
                    </button>
                </div>
            </div>
        </div>
    )
}

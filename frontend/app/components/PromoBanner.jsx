'use client'
import { useEffect, useState } from 'react'
import { getJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'

/**
 * Storefront promo banner — shows featured/limited discount codes (set as
 * "featured" in admin). Renders nothing when there are none, so it's safe to
 * always mount. Clicking a code copies it.
 */
function describe(d) {
    const base = d.type === 'percent' ? `${Number(d.value)}% off`
        : d.type === 'fixed' ? `${Number(d.value)} AED off`
        : 'Free shipping'
    const cond = []
    if (Number(d.min_spend) > 0) cond.push(`min ${Number(d.min_spend)} AED`)
    if (d.first_order_only) cond.push('first order')
    return cond.length ? `${base} · ${cond.join(' · ')}` : base
}

export default function PromoBanner() {
    const toast = useToast()
    const [promos, setPromos] = useState([])

    useEffect(() => {
        let active = true
        ;(async () => {
            const r = await getJSON('/discounts/featured')
            if (active && r.ok && Array.isArray(r.data)) setPromos(r.data)
        })()
        return () => { active = false }
    }, [])

    if (!promos.length) return null

    const copy = (code) => {
        try { navigator.clipboard.writeText(code); toast.success(`Copied ${code}`) } catch { /* ignore */ }
    }

    return (
        <div className="flex flex-col gap-2 mb-2">
            {promos.map((d) => {
                const expiry = d.expires_at ? new Date(d.expires_at) : null
                return (
                    <div key={d.code} className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-r from-blue to-light-blue text-off-white shadow-md">
                        <span className="text-xl">🎉</span>
                        <span className="font-semibold">{describe(d)}</span>
                        <button onClick={() => copy(d.code)} className="font-mono font-bold bg-off-white/20 hover:bg-off-white/30 transition-colors rounded-md px-3 py-1 text-sm" title="Copy code">
                            {d.code}
                        </button>
                        {expiry ? <span className="text-sm font-light opacity-90 ml-auto">Ends {expiry.toLocaleDateString()}</span> : null}
                    </div>
                )
            })}
        </div>
    )
}

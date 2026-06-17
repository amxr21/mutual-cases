'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrderView } from '.'
import { getJSON } from '../lib/safeFetch'
import { useI18n } from '../i18n/I18nProvider'

// Active (in-delivery) statuses: Pending(1), Confirmed(2), Shipped(3).
const ACTIVE_STATUS = new Set([1, 2, 3])
const STATUS_COLOR = {
    Pending: 'bg-gold/15 text-gold', Confirmed: 'bg-blue/15 text-blue', Shipped: 'bg-blue/15 text-blue',
}

/**
 * Track Order. Left: lookup form + order info; right: order-journey stepper.
 * When a signed-in customer has active (in-delivery) orders, they're shown as
 * quick-track cards ABOVE the form. Pre-fills from ?order= for deep-links.
 */
export default function TrackOrder() {
    const params = useSearchParams()
    const { t } = useI18n()
    const initial = params.get('order') || ''
    const [input, setInput] = useState(initial)
    const [tracking, setTracking] = useState(initial)
    const [pending, setPending] = useState([])
    const deepLinked = !!initial

    useEffect(() => {
        setInput(initial)
        setTracking(initial)
    }, [initial])

    // Load the signed-in customer's active orders (best-effort).
    useEffect(() => {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!userId) return
        let active = true
        ;(async () => {
            const r = await getJSON('/orders')
            if (!active) return
            if (r.ok && Array.isArray(r.data)) {
                setPending(r.data.filter((o) => ACTIVE_STATUS.has(o.status_id)))
            }
        })()
        return () => { active = false }
    }, [])

    const submit = (e) => {
        e.preventDefault()
        setTracking(input.trim())
    }

    const pendingBlock = pending.length ? (
        <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-3 mb-6">
            <h3 className="text-lg font-semibold">{t('orders.inDelivery', 'Orders on the way')}</h3>
            <div className="flex flex-col gap-2">
                {pending.map((o) => (
                    <button
                        key={o.order_number}
                        onClick={() => { setInput(o.order_number); setTracking(o.order_number) }}
                        className="flex items-center justify-between gap-3 text-left rounded-lg border border-black/5 hover:border-blue/40 transition-colors p-3"
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold">{o.order_number}</span>
                            <span className="text-sm font-light text-off-black/60">{new Date(o.order_date).toLocaleDateString()} · {o.item_count} item{o.item_count == 1 ? '' : 's'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[o.status] || 'bg-gray-200'}`}>{o.status}</span>
                            <span className="text-sm text-blue font-medium">{t('orders.track', 'Track')} →</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    ) : null

    const trackForm = (
        <form onSubmit={submit} className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{t('orders.findOrder', 'Find your order')}</h3>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('orders.orderNumberPlaceholder', 'Order number (e.g. MTL-XXXX-1234)')}
                    className="grow bg-off-white border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-blue transition-colors"
                />
                <button
                    type="submit"
                    className="bg-blue text-off-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 hover:brightness-110 active:scale-[0.99]"
                >
                    {t('orders.track', 'Track')}
                </button>
            </div>
        </form>
    )

    if (!tracking) {
        // No number yet — show active orders (if any) then the lookup form.
        return <div className="max-w-2xl">{pendingBlock}{trackForm}</div>
    }

    return (
        <div key={tracking} className="reveal">
            {/* When deep-linked, the order number is fixed — hide the lookup form
                so the user can't change it from inside the tracking view. When
                the user searched manually, keep the form (+ their active orders). */}
            <OrderView
                orderNumber={tracking}
                showTrackLink={false}
                layout="split"
                leftExtra={deepLinked ? null : <>{pendingBlock}{trackForm}</>}
            />
        </div>
    )
}

'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJSON } from '../lib/safeFetch'
import { EmptyState, ReviewForm, ReturnRequest } from '.'
import { useI18n } from '../i18n/I18nProvider'

/**
 * Logged-in order history with Current / Previous tabs.
 *   Current  = Pending, Confirmed, Shipped (status_id 1,2,3)
 *   Previous = Delivered, Canceled, Returned (status_id 4,5,6)
 * Each order lists its items; delivered orders expose a review form per product
 * (server enforces purchase-gating). Reviews already left are prefilled.
 */
const CURRENT_STATUS = new Set([1, 2, 3])
const STATUS_COLOR = {
    Pending: 'bg-gold/15 text-gold', Confirmed: 'bg-blue/15 text-blue', Shipped: 'bg-blue/15 text-blue',
    Delivered: 'bg-green-600/15 text-green-700', Canceled: 'bg-red-500/15 text-red-600', Returned: 'bg-gray-400/20 text-gray-600',
}

export default function MyOrders() {
    const { t } = useI18n()
    const [orders, setOrders] = useState([])
    const [myReviews, setMyReviews] = useState({}) // product_id -> {rating, comment}
    const [tab, setTab] = useState('current')
    const [status, setStatus] = useState('loading') // loading | ready | empty | guest | error

    useEffect(() => {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!userId) { setStatus('guest'); return }
        let active = true
        ;(async () => {
            const [ordersRes, reviewsRes] = await Promise.all([getJSON('/orders'), getJSON('/reviews/mine')])
            if (!active) return
            if (ordersRes.ok && Array.isArray(ordersRes.data)) {
                setOrders(ordersRes.data)
                setStatus(ordersRes.data.length ? 'ready' : 'empty')
            } else setStatus('error')
            if (reviewsRes.ok && Array.isArray(reviewsRes.data)) {
                const map = {}
                for (const r of reviewsRes.data) map[r.product_id] = r
                setMyReviews(map)
            }
        })()
        return () => { active = false }
    }, [])

    const onReviewed = (rev) => setMyReviews((prev) => ({ ...prev, [rev.product_id]: rev }))

    if (status === 'loading') return (
        <div className="flex items-center gap-3 py-8 text-off-black/60">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-blue/25 border-t-blue animate-spin" />
            <span className="font-light">{t('common.loading')}</span>
        </div>
    )
    if (status === 'guest')
        return <EmptyState icon="lock" title="Please log in to see your orders" message="Your order history is tied to your account." action={{ label: 'Go to homepage', href: '/' }} />
    if (status === 'error')
        return <EmptyState icon="alert" title="We couldn't load your orders" message="Please refresh the page to try again." />
    if (status === 'empty')
        return <EmptyState icon="box" title="You have no orders yet" message="When you place an order it'll show up here." action={{ label: 'Start shopping', href: '/products' }} />

    const filtered = orders.filter((o) =>
        tab === 'current' ? CURRENT_STATUS.has(o.status_id) : !CURRENT_STATUS.has(o.status_id)
    )

    return (
        <div className="flex flex-col gap-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-blue/5 p-1 rounded-lg w-fit">
                {[['current', t('orders.current')], ['previous', t('orders.previous')]].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-5 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                            tab === key ? 'bg-blue text-off-white shadow-sm' : 'text-blue hover:bg-blue/10'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon="box"
                    size="sm"
                    title={tab === 'current' ? 'No current orders' : 'No past orders'}
                    message={tab === 'current' ? 'Orders in progress will appear here.' : 'Delivered and closed orders will appear here.'}
                />
            ) : (
                <div className="flex flex-col gap-4">
                    {filtered.map((o) => {
                        const canReview = o.status_id === 4 // Delivered
                        return (
                            <div key={o.order_number} className="bg-off-white rounded-xl shadow-sm border border-black/5 p-4 xl:p-5 flex flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{o.order_number}</span>
                                        <span className="text-sm font-light text-off-black/60">
                                            {new Date(o.order_date).toLocaleDateString()} · {o.item_count} item{o.item_count == 1 ? '' : 's'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[o.status] || 'bg-gray-200'}`}>{o.status}</span>
                                        <span className="font-semibold whitespace-nowrap">{o.total} AED</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="flex flex-col divide-y divide-black/5 border-t border-black/5 pt-2">
                                    {o.items?.map((it) => (
                                        <div key={it.product_id} className="py-2 flex flex-col gap-1">
                                            <div className="flex justify-between gap-3">
                                                <span className="capitalize font-light">{it.category} {it.model} <span className="opacity-60">×{it.quantity}</span></span>
                                                <span className="font-semibold whitespace-nowrap">{Number(it.price) * Number(it.quantity)} AED</span>
                                            </div>
                                            {canReview ? (
                                                <ReviewForm productId={it.product_id} existing={myReviews[it.product_id]} onSubmitted={onReviewed} />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <Link href={`/track-order?order=${encodeURIComponent(o.order_number)}`} className="text-sm text-blue underline self-start">
                                        {t('orders.trackThis')} →
                                    </Link>
                                    {canReview ? <ReturnRequest order={o} /> : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

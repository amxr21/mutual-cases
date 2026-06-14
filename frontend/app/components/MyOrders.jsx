'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJSON } from '../lib/safeFetch'

/**
 * Logged-in user's order history. Lists all of the user's orders (status, date,
 * total, items) with a link into the existing order tracker. Distinct from the
 * public /track-order quick-lookup.
 */
const STATUS_COLOR = {
    Pending: 'bg-gold/15 text-gold',
    Confirmed: 'bg-blue/15 text-blue',
    Shipped: 'bg-blue/15 text-blue',
    Delivered: 'bg-green-600/15 text-green-700',
    Canceled: 'bg-red-500/15 text-red-600',
    Returned: 'bg-gray-400/20 text-gray-600',
}

export default function MyOrders() {
    const [orders, setOrders] = useState([])
    const [status, setStatus] = useState('loading') // loading | ready | empty | guest | error

    useEffect(() => {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!userId) {
            setStatus('guest')
            return
        }
        let active = true
        ;(async () => {
            const result = await getJSON('/orders')
            if (!active) return
            if (result.ok && Array.isArray(result.data)) {
                setOrders(result.data)
                setStatus(result.data.length ? 'ready' : 'empty')
            } else {
                setStatus('error')
            }
        })()
        return () => {
            active = false
        }
    }, [])

    if (status === 'loading') return <p className="font-light py-8">Loading your orders…</p>
    if (status === 'guest')
        return (
            <div className="flex flex-col items-start gap-3 py-8">
                <p className="font-light text-lg">Please log in to see your orders.</p>
                <Link href="/" className="text-blue underline font-medium">Go to homepage</Link>
            </div>
        )
    if (status === 'error') return <p className="font-light text-blue py-8">We couldn&apos;t load your orders. Please refresh.</p>
    if (status === 'empty')
        return (
            <div className="flex flex-col items-start gap-3 py-8">
                <p className="font-light text-lg">You have no orders yet.</p>
                <Link href="/products" className="text-blue underline font-medium">Start shopping</Link>
            </div>
        )

    return (
        <div className="flex flex-col gap-4">
            {orders.map((o) => (
                <Link
                    key={o.order_number}
                    href={`/track-order?order=${encodeURIComponent(o.order_number)}`}
                    className="bg-off-white rounded-xl shadow-sm border border-black/5 p-4 xl:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">{o.order_number}</span>
                        <span className="text-sm font-light text-off-black/60">
                            {new Date(o.order_date).toLocaleDateString()} · {o.item_count} item{o.item_count == 1 ? '' : 's'} · {o.payment_method === 'card_on_delivery' ? 'Card on delivery' : 'Cash on delivery'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[o.status] || 'bg-gray-200'}`}>{o.status}</span>
                        <span className="font-semibold whitespace-nowrap">{o.total} AED</span>
                        <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-off-black/40" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </Link>
            ))}
        </div>
    )
}

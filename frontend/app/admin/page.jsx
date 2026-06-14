'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJSON } from '../lib/safeFetch'

const STAT_CARDS = [
    { key: 'revenue', label: 'Revenue (confirmed)', suffix: ' AED', accent: 'text-blue' },
    { key: 'orders', label: 'Total Orders' },
    { key: 'pending', label: 'Pending Orders', accent: 'text-gold' },
    { key: 'products', label: 'Products' },
    { key: 'customers', label: 'Customers' },
    { key: 'customRequests', label: 'Custom Requests' },
]

export default function AdminOverview() {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let active = true
        ;(async () => {
            const r = await getJSON('/admin/overview')
            if (!active) return
            if (r.ok && r.data?.totals) {
                setData(r.data)
                setStatus('ready')
            } else {
                setStatus('error')
            }
        })()
        return () => { active = false }
    }, [])

    if (status === 'loading') return <p className="font-light">Loading dashboard…</p>
    if (status === 'error') return <p className="text-blue">Couldn&apos;t load the dashboard.</p>

    const { totals, statusBreakdown, recentOrders } = data

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold">Overview</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {STAT_CARDS.map((c) => (
                    <div key={c.key} className="bg-off-white rounded-xl shadow-sm border border-black/5 p-5">
                        <p className="text-sm font-light text-off-black/60">{c.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${c.accent || 'text-off-black'}`}>
                            {Number(totals[c.key] ?? 0).toLocaleString()}{c.suffix || ''}
                        </p>
                    </div>
                ))}
            </div>

            {/* Status breakdown */}
            <div className="bg-off-white rounded-xl shadow-sm border border-black/5 p-5">
                <h2 className="text-lg font-semibold mb-4">Orders by status</h2>
                <div className="flex flex-wrap gap-3">
                    {statusBreakdown.map((s) => (
                        <div key={s.status} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue/5">
                            <span className="font-light">{s.status}</span>
                            <span className="font-bold text-blue">{s.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent orders */}
            <div className="bg-off-white rounded-xl shadow-sm border border-black/5 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent orders</h2>
                    <Link href="/admin/orders" className="text-blue text-sm underline">View all</Link>
                </div>
                <div className="flex flex-col divide-y divide-black/5">
                    {recentOrders.length === 0 ? <p className="font-light">No orders yet.</p> : null}
                    {recentOrders.map((o) => (
                        <div key={o.order_number} className="flex items-center justify-between py-3 gap-3">
                            <span className="font-medium">{o.order_number}</span>
                            <span className="text-sm font-light text-off-black/60">{new Date(o.order_date).toLocaleDateString()}</span>
                            <span className="text-sm">{o.status}</span>
                            <span className="font-semibold whitespace-nowrap">{o.total} AED</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

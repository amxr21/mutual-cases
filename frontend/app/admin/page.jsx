'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJSON } from '../lib/safeFetch'
import { PageHeader, StatCard, Badge } from './ui/primitives'

const STATUS_TONE = { Pending: 'gold', Confirmed: 'blue', Shipped: 'blue', Delivered: 'green', Canceled: 'red', Returned: 'neutral' }
const aed = (n) => `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} AED`

function Trend({ pct }) {
    if (pct == null) return <span className="ui-muted text-xs">no prior data</span>
    const up = pct >= 0
    return (
        <span className="text-xs font-semibold" style={{ color: up ? 'var(--ui-success)' : 'var(--ui-danger)' }}>
            {up ? '▲' : '▼'} {Math.abs(pct)}% vs prev 30d
        </span>
    )
}

export default function AdminOverview() {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let active = true
        ;(async () => {
            const r = await getJSON('/admin/overview')
            if (!active) return
            if (r.ok && r.data?.totals) { setData(r.data); setStatus('ready') }
            else setStatus('error')
        })()
        return () => { active = false }
    }, [])

    if (status === 'loading') return <p className="ui-muted">Loading dashboard…</p>
    if (status === 'error') return <p style={{ color: 'var(--ui-danger)' }}>Couldn&apos;t load the dashboard.</p>

    const { totals, metrics, pendingActions, delivery, lowStock, topProducts, system, statusBreakdown, recentOrders } = data
    const m = metrics || {}
    const pa = pendingActions || {}
    const actionTotal = (pa.ordersToFulfill || 0) + (pa.reviewsToModerate || 0) + (pa.customRequestsPending || 0)

    return (
        <div>
            <PageHeader title="Overview" subtitle="Your store at a glance" />

            {/* Revenue windows + KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                <StatCard label="Revenue today" value={aed(m.revenueToday)} tone="gold" />
                <StatCard label="Revenue (7d)" value={aed(m.revenue7d)} />
                <StatCard label="Revenue (30d)" value={aed(m.revenue30d)} />
                <StatCard label="Avg order value" value={aed(m.aov)} />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="ui-surface p-5 flex flex-col gap-1">
                    <span className="ui-muted text-sm">Orders (30d)</span>
                    <span className="text-3xl font-bold" style={{ color: 'var(--ui-text)' }}>{m.orders30d ?? 0}</span>
                    <Trend pct={m.orderTrendPct} />
                </div>
                <StatCard label="Total revenue (realized)" value={aed(totals.revenue)} />
                <StatCard label="Avg rating" value={`${m.reviewAvg ?? 0} ★`} sub={`${m.reviewCount ?? 0} approved reviews`} />
                <StatCard label="Customers" value={totals.customers} sub={`${totals.orders} orders all-time`} />
            </div>

            {/* Pending actions panel */}
            <div className="ui-surface p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold" style={{ color: 'var(--ui-text)' }}>Pending actions</h2>
                    <Badge tone={actionTotal ? 'gold' : 'green'}>{actionTotal} to handle</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ActionTile href="/admin/orders" label="Orders to fulfill" count={pa.ordersToFulfill} tone="gold" />
                    <ActionTile href="/admin/reviews" label="Reviews to moderate" count={pa.reviewsToModerate} tone="blue" />
                    <ActionTile href="/admin/custom-requests" label="Custom requests pending" count={pa.customRequestsPending} tone="blue" />
                </div>
            </div>

            {/* Two-column: orders-by-status + recent orders */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                <div className="ui-surface p-5">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--ui-text)' }}>Orders by status</h2>
                    <div className="flex flex-col gap-3">
                        {statusBreakdown.map((s) => {
                            const max = Math.max(...statusBreakdown.map((x) => x.count), 1)
                            return (
                                <div key={s.status} className="flex items-center gap-3">
                                    <span className="w-24 text-sm" style={{ color: 'var(--ui-text)' }}>{s.status}</span>
                                    <div className="grow h-2 rounded-full overflow-hidden" style={{ background: 'var(--ui-surface-2)' }}>
                                        <div className="h-full rounded-full" style={{ width: `${(s.count / max) * 100}%`, background: 'var(--ui-primary)' }} />
                                    </div>
                                    <span className="text-sm font-semibold w-8 text-right" style={{ color: 'var(--ui-text)' }}>{s.count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="ui-surface p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold" style={{ color: 'var(--ui-text)' }}>Recent orders</h2>
                        <Link href="/admin/orders" className="text-sm" style={{ color: 'var(--ui-primary)' }}>View all</Link>
                    </div>
                    <div className="flex flex-col">
                        {recentOrders.length === 0 ? <p className="ui-muted text-sm">No orders yet.</p> : null}
                        {recentOrders.map((o) => (
                            <div key={o.order_number} className="flex items-center justify-between py-2.5 border-b ui-border last:border-0 gap-2">
                                <span className="font-medium text-sm" style={{ color: 'var(--ui-text)' }}>{o.order_number}</span>
                                <Badge tone={STATUS_TONE[o.status] || 'neutral'}>{o.status}</Badge>
                                <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--ui-text)' }}>{o.total} AED</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top products + low stock */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                <div className="ui-surface p-5">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--ui-text)' }}>Top products (by units)</h2>
                    {(!topProducts || topProducts.length === 0) ? <p className="ui-muted text-sm">No sales yet.</p> : (
                        <div className="flex flex-col">
                            {topProducts.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-2.5 border-b ui-border last:border-0 gap-2">
                                    <span className="text-sm capitalize" style={{ color: 'var(--ui-text)' }}>{p.category} {p.model}</span>
                                    <span className="text-sm ui-muted">{p.units} sold</span>
                                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--ui-text)' }}>{aed(p.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="ui-surface p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold" style={{ color: 'var(--ui-text)' }}>Low stock</h2>
                        <Link href="/admin/products" className="text-sm" style={{ color: 'var(--ui-primary)' }}>Manage</Link>
                    </div>
                    {(!lowStock || lowStock.length === 0) ? <p className="ui-muted text-sm">All products are well stocked.</p> : (
                        <div className="flex flex-col">
                            {lowStock.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-2.5 border-b ui-border last:border-0 gap-2">
                                    <span className="text-sm capitalize" style={{ color: 'var(--ui-text)' }}>{p.category} {p.model}</span>
                                    <Badge tone={p.quantity === 0 ? 'red' : 'gold'}>{p.quantity === 0 ? 'Out of stock' : `${p.quantity} left`}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delivery + system / technical */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="ui-surface p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold" style={{ color: 'var(--ui-text)' }}>Delivery staff</h2>
                        <Link href="/admin/delivery" className="text-sm" style={{ color: 'var(--ui-primary)' }}>Manage</Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <Stat label="On shift" value={delivery?.on_shift ?? 0} tone="var(--ui-primary)" />
                        <Stat label="Active" value={delivery?.active ?? 0} tone="var(--ui-success)" />
                        <Stat label="Inactive" value={delivery?.inactive ?? 0} tone="var(--ui-text-muted)" />
                    </div>
                </div>

                <div className="ui-surface p-5">
                    <h2 className="font-semibold mb-4" style={{ color: 'var(--ui-text)' }}>System</h2>
                    <dl className="grid grid-cols-2 gap-y-2 text-sm">
                        <Row k="Environment" v={system?.env} />
                        <Row k="Node" v={system?.node} />
                        <Row k="Uptime" v={system ? formatUptime(system.uptimeSeconds) : '—'} />
                        <Row k="DB pool limit" v={system?.dbPool?.connectionLimit} />
                        <Row k="Server time" v={system ? new Date(system.now).toLocaleTimeString() : '—'} />
                        <Row k="Products" v={totals.products} />
                    </dl>
                </div>
            </div>
        </div>
    )
}

function ActionTile({ href, label, count, tone }) {
    const n = count || 0
    return (
        <Link href={href} className="rounded-lg p-4 flex items-center justify-between transition-colors" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>{label}</span>
            <Badge tone={n ? tone : 'green'}>{n}</Badge>
        </Link>
    )
}

function Stat({ label, value, tone }) {
    return (
        <div className="flex flex-col">
            <span className="text-2xl font-bold" style={{ color: tone }}>{value}</span>
            <span className="ui-muted text-xs">{label}</span>
        </div>
    )
}

function Row({ k, v }) {
    return (
        <>
            <dt className="ui-muted">{k}</dt>
            <dd className="text-right font-medium" style={{ color: 'var(--ui-text)' }}>{v ?? '—'}</dd>
        </>
    )
}

function formatUptime(s) {
    if (!s && s !== 0) return '—'
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m`
    return `${s}s`
}

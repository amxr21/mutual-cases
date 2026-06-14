'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'

const STATUSES = [
    { id: 1, label: 'Pending' },
    { id: 2, label: 'Confirmed' },
    { id: 3, label: 'Shipped' },
    { id: 4, label: 'Delivered' },
    { id: 5, label: 'Canceled' },
    { id: 6, label: 'Returned' },
]

export default function AdminOrders() {
    const toast = useToast()
    const [orders, setOrders] = useState([])
    const [status, setStatus] = useState('loading')
    const [filter, setFilter] = useState('')
    const [expanded, setExpanded] = useState(null)
    const [detail, setDetail] = useState(null)
    const [saving, setSaving] = useState(null)

    const load = async () => {
        setStatus('loading')
        const r = await getJSON(`/admin/orders${filter ? `?status=${filter}` : ''}`)
        if (r.ok && Array.isArray(r.data)) {
            setOrders(r.data)
            setStatus('ready')
        } else setStatus('error')
    }

    useEffect(() => { load() /* eslint-disable-next-line */ }, [filter])

    const openDetail = async (orderNumber) => {
        if (expanded === orderNumber) { setExpanded(null); return }
        setExpanded(orderNumber)
        setDetail(null)
        const r = await getJSON(`/admin/orders/${orderNumber}`)
        if (r.ok) setDetail(r.data)
    }

    const changeStatus = async (orderNumber, statusId) => {
        setSaving(orderNumber)
        const r = await patchJSON(`/admin/orders/${orderNumber}/status`, { status_id: Number(statusId) })
        setSaving(null)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success('Status updated')
        setOrders((prev) => prev.map((o) => o.order_number === orderNumber
            ? { ...o, status_id: Number(statusId), status: STATUSES.find((s) => s.id === Number(statusId))?.label }
            : o))
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-bold">Orders</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-off-white border border-gray-300 rounded-lg py-2 px-3 outline-none focus:border-blue"
                >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
            </div>

            {status === 'loading' ? <p className="font-light">Loading orders…</p> : null}
            {status === 'error' ? <p className="text-blue">Couldn&apos;t load orders.</p> : null}

            {status === 'ready' ? (
                <div className="flex flex-col gap-3">
                    {orders.length === 0 ? <p className="font-light">No orders.</p> : null}
                    {orders.map((o) => (
                        <div key={o.order_number} className="bg-off-white rounded-xl shadow-sm border border-black/5 overflow-hidden">
                            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-col">
                                    <span className="font-semibold">{o.order_number}</span>
                                    <span className="text-sm font-light text-off-black/60">
                                        {o.customer_name || 'Guest'} · {new Date(o.order_date).toLocaleDateString()} · {o.item_count} items
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold whitespace-nowrap">{o.total} AED</span>
                                    <select
                                        value={o.status_id}
                                        disabled={saving === o.order_number}
                                        onChange={(e) => changeStatus(o.order_number, e.target.value)}
                                        className="bg-blue/5 border border-blue/30 text-blue rounded-lg py-1.5 px-2 outline-none focus:border-blue text-sm"
                                    >
                                        {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                    <button onClick={() => openDetail(o.order_number)} className="text-sm text-blue underline">
                                        {expanded === o.order_number ? 'Hide' : 'Details'}
                                    </button>
                                </div>
                            </div>

                            {expanded === o.order_number ? (
                                <div className="border-t border-black/5 p-4 bg-blue/[0.02] text-sm">
                                    {!detail ? <p className="font-light">Loading…</p> : (
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <span className="font-semibold">Customer: </span>
                                                {detail.customer_name} ({detail.customer_email})
                                            </div>
                                            <div>
                                                <span className="font-semibold">Payment: </span>
                                                {detail.payment_method} {detail.gift ? '· 🎁 Gift' : ''}
                                            </div>
                                            {detail.note ? <div><span className="font-semibold">Note: </span>{detail.note}</div> : null}
                                            {detail.address ? (
                                                <div><span className="font-semibold">Ship to: </span>
                                                    {[detail.address.address, detail.address.area, detail.address.city, detail.address.country].filter(Boolean).join(', ')}
                                                </div>
                                            ) : null}
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold">Items:</span>
                                                {detail.items?.map((it) => (
                                                    <div key={it.product_id} className="flex justify-between">
                                                        <span className="capitalize font-light">{it.category} {it.model} ({it.type}) ×{it.quantity}</span>
                                                        <span>{Number(it.price) * Number(it.quantity)} AED</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

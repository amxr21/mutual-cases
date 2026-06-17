'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import RefreshButton from '../ui/RefreshButton'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import Select from '../ui/Select'
import ReportLink from '../ui/ReportLink'

const STATUSES = [
    { id: 1, label: 'Pending' }, { id: 2, label: 'Confirmed' }, { id: 3, label: 'Shipped' },
    { id: 4, label: 'Delivered' }, { id: 5, label: 'Canceled' }, { id: 6, label: 'Returned' },
]
const TONE = { Pending: 'gold', Confirmed: 'blue', Shipped: 'blue', Delivered: 'green', Canceled: 'red', Returned: 'neutral' }
const PAYMENT_LABEL = { cod: 'Cash on delivery', card_on_delivery: 'Card on delivery' }
const TONE_DOT = { Pending: 'var(--ui-accent)', Confirmed: 'var(--ui-primary)', Shipped: 'var(--ui-primary)', Delivered: 'var(--ui-success)', Canceled: 'var(--ui-danger)', Returned: 'var(--ui-text-muted)' }
const fmtDateTime = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function AdminOrders() {
    const toast = useToast()
    const [orders, setOrders] = useState([])
    const [status, setStatus] = useState('loading')
    const [detail, setDetail] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [drivers, setDrivers] = useState([])
    const [ship, setShip] = useState({ delivery_user_id: '', tracking_number: '', carrier: '', eta: '' })

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/orders')
        if (r.ok && Array.isArray(r.data)) { setOrders(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])
    // Load available drivers once for the assignment picker.
    useEffect(() => {
        ;(async () => {
            const r = await getJSON('/admin/delivery-options')
            if (r.ok && Array.isArray(r.data)) setDrivers(r.data)
        })()
    }, [])

    const openDetail = async (orderNumber) => {
        setDrawerOpen(true)
        setDetail(null)
        const r = await getJSON(`/admin/orders/${orderNumber}`)
        if (r.ok) {
            setDetail(r.data)
            setShip({
                delivery_user_id: r.data.delivery_user_id ? String(r.data.delivery_user_id) : '',
                tracking_number: r.data.tracking_number || '',
                carrier: r.data.carrier || '',
                eta: r.data.eta ? String(r.data.eta).slice(0, 10) : '',
            })
        }
    }

    const saveDelivery = async () => {
        if (!detail) return
        setSaving(true)
        const payload = {
            delivery_user_id: ship.delivery_user_id ? Number(ship.delivery_user_id) : null,
            tracking_number: ship.tracking_number,
            carrier: ship.carrier,
            eta: ship.eta,
        }
        const r = await patchJSON(`/admin/orders/${detail.order_number}/delivery`, payload)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success(r.data?.autoShipped ? 'Driver assigned — order marked Shipped' : 'Delivery details saved')
        // Re-fetch so the timeline + any auto status change reflect immediately.
        const fresh = await getJSON(`/admin/orders/${detail.order_number}`)
        if (fresh.ok) {
            setDetail(fresh.data)
            setOrders((prev) => prev.map((o) => o.order_number === detail.order_number ? { ...o, status_id: fresh.data.status_id, status: fresh.data.status } : o))
        }
    }

    const changeStatus = async (orderNumber, statusId) => {
        setSaving(true)
        const r = await patchJSON(`/admin/orders/${orderNumber}/status`, { status_id: Number(statusId) })
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success('Status updated — customer notified')
        const label = STATUSES.find((s) => s.id === Number(statusId))?.label
        setOrders((prev) => prev.map((o) => o.order_number === orderNumber ? { ...o, status_id: Number(statusId), status: label } : o))
        // Re-fetch detail so the status-history timeline reflects the new entry.
        const fresh = await getJSON(`/admin/orders/${orderNumber}`)
        if (fresh.ok) setDetail(fresh.data)
        else setDetail((d) => d ? { ...d, status_id: Number(statusId), status: label } : d)
    }

    const columns = [
        { key: 'order_number', header: 'Order', sortable: true, render: (o) => <span className="font-medium">{o.order_number}</span> },
        { key: 'customer_name', header: 'Customer', sortable: true, render: (o) => o.customer_name || 'Guest' },
        { key: 'order_date', header: 'Placed', sortable: true, render: (o) => (
            <span className="whitespace-nowrap">{new Date(o.order_date).toLocaleDateString()} <span className="ui-muted">{new Date(o.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
        ) },
        { key: 'item_count', header: 'Items', sortable: true, align: 'center' },
        { key: 'payment_method', header: 'Payment', render: (o) => <span className="capitalize">{PAYMENT_LABEL[o.payment_method] || o.payment_method || '—'}</span> },
        { key: 'total', header: 'Total', sortable: true, align: 'right', render: (o) => `${o.total} AED` },
        { key: 'status', header: 'Status', sortable: true, render: (o) => <Badge tone={TONE[o.status] || 'neutral'}>{o.status}</Badge> },
    ]

    if (status === 'loading') return <Loader rows={6} />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load orders" message="Please refresh to try again." />

    return (
        <div>
            <PageHeader title="Orders" subtitle={`${orders.length} total`} actions={<><RefreshButton onRefresh={load} /><ReportLink report="orders-detail" /></>} />

            <DataTable
                columns={columns}
                rows={orders}
                searchKeys={['order_number', 'customer_name', 'customer_email', 'status']}
                searchPlaceholder="Search orders…"
                rowKey={(o) => o.order_number}
                rowActions={(o) => (
                    <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openDetail(o.order_number)}>View</button>
                )}
            />

            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={detail ? detail.order_number : 'Order'} width="40rem">
                {!detail ? <Loader rows={6} /> : (
                    <div className="flex flex-col gap-5">
                        {/* Header: status + total */}
                        <div className="flex items-center justify-between">
                            <Badge tone={TONE[detail.status] || 'neutral'}>{detail.status}</Badge>
                            <span className="font-bold text-lg" style={{ color: 'var(--ui-text)' }}>{detail.total} AED</span>
                        </div>

                        {/* Summary grid — the "full details" at a glance */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm rounded-lg p-3" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                            <Meta label="Placed" value={fmtDateTime(detail.order_date)} />
                            <Meta label="Items" value={`${detail.items?.reduce((n, it) => n + Number(it.quantity), 0) || 0} (${detail.items?.length || 0} line${detail.items?.length === 1 ? '' : 's'})`} />
                            <Meta label="Payment" value={PAYMENT_LABEL[detail.payment_method] || detail.payment_method || '—'} />
                            <Meta label="Gift" value={detail.gift ? '🎁 Yes' : 'No'} />
                            <Meta label="Order #" value={detail.order_number} />
                            <Meta label="Internal ID" value={`#${detail.id}`} />
                        </div>

                        <a
                            href={`/admin/orders/${detail.order_number}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ui-btn ui-btn-ghost justify-center"
                        >
                            🧾 Invoice / packing slip
                        </a>

                        <SectionTitle>Status</SectionTitle>
                        <div>
                            <Select
                                value={String(detail.status_id)}
                                disabled={saving}
                                onChange={(v) => changeStatus(detail.order_number, v)}
                                options={STATUSES.map((s) => ({ label: s.label, value: String(s.id) }))}
                            />
                            <p className="ui-muted text-xs mt-1">Changing status emails the customer.</p>
                        </div>

                        {/* Delivery assignment — driver + tracking shown to the customer on Track Order. */}
                        <div className="rounded-lg p-3 flex flex-col gap-3" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                            <span className="ui-muted text-xs font-semibold uppercase">Delivery</span>
                            <div>
                                <label className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Assigned driver</label>
                                <div className="mt-1">
                                    <Select
                                        value={ship.delivery_user_id}
                                        onChange={(v) => setShip((s) => ({ ...s, delivery_user_id: v }))}
                                        options={[{ label: 'Unassigned', value: '' }, ...drivers.map((d) => ({ label: `${d.name}${d.emirate ? ` · ${d.emirate}` : ''}`, value: String(d.id) }))]}
                                        placeholder="Unassigned"
                                    />
                                </div>
                                {drivers.length === 0 ? <p className="ui-muted text-xs mt-1">No active drivers — add them in Delivery.</p> : null}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Carrier</label>
                                    <input value={ship.carrier} onChange={(e) => setShip((s) => ({ ...s, carrier: e.target.value }))} className="ui-input mt-1" placeholder="Aramex / In-house" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>ETA</label>
                                    <input type="date" value={ship.eta} onChange={(e) => setShip((s) => ({ ...s, eta: e.target.value }))} className="ui-input mt-1" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Tracking number</label>
                                <input value={ship.tracking_number} onChange={(e) => setShip((s) => ({ ...s, tracking_number: e.target.value }))} className="ui-input mt-1" />
                            </div>
                            <div className="flex justify-end">
                                <button className="ui-btn ui-btn-primary !py-1.5" onClick={saveDelivery} disabled={saving}>{saving ? 'Saving…' : 'Save delivery'}</button>
                            </div>
                        </div>

                        {/* Customer */}
                        <SectionTitle>Customer</SectionTitle>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                            <Meta label="Name" value={detail.customer_name || 'Guest'} />
                            <Meta label="Phone" value={detail.customer_phone || '—'} />
                            <Meta label="Email" value={detail.customer_email || '—'} span />
                            {detail.customer_since ? <Meta label="Customer since" value={new Date(detail.customer_since).toLocaleDateString()} /> : null}
                        </div>

                        {/* Shipping address */}
                        <SectionTitle>Shipping address</SectionTitle>
                        {detail.address ? (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                                <Meta label="Country" value={detail.address.country || '—'} />
                                <Meta label="City" value={detail.address.city || '—'} />
                                <Meta label="Area" value={detail.address.area || '—'} />
                                <Meta label="Street / building" value={detail.address.address || '—'} />
                            </div>
                        ) : <p className="ui-muted text-sm">No address on file.</p>}

                        {/* Items — itemized with unit price + subtotal */}
                        <SectionTitle>Items ({detail.items?.length || 0})</SectionTitle>
                        <div className="flex flex-col gap-2">
                            {detail.items?.map((it) => (
                                <div key={it.product_id} className="flex items-center justify-between gap-3 text-sm ui-surface p-2.5">
                                    <div className="flex flex-col">
                                        <span className="capitalize font-medium" style={{ color: 'var(--ui-text)' }}>{it.category} {it.model}</span>
                                        <span className="ui-muted text-xs capitalize">{it.edition ? `${it.edition} · ` : ''}{it.type} · {it.price} AED × {it.quantity}</span>
                                    </div>
                                    <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--ui-text)' }}>{Number(it.price) * Number(it.quantity)} AED</span>
                                </div>
                            ))}
                            <div className="flex justify-between border-t ui-border pt-2 mt-1 font-semibold" style={{ color: 'var(--ui-text)' }}>
                                <span>Total</span>
                                <span>{detail.total} AED</span>
                            </div>
                        </div>

                        {/* Gift / note */}
                        {detail.gift && detail.gift_message ? (
                            <div className="text-sm flex flex-col gap-1">
                                <span style={{ color: 'var(--ui-text)' }} className="font-semibold">🎁 Gift message</span>
                                <span className="ui-muted">{detail.gift_message}</span>
                            </div>
                        ) : null}
                        {detail.note ? (
                            <div className="text-sm flex flex-col gap-1">
                                <span style={{ color: 'var(--ui-text)' }} className="font-semibold">Customer note</span>
                                <span className="ui-muted">{detail.note}</span>
                            </div>
                        ) : null}

                        {/* Status history timeline */}
                        <SectionTitle>Status history</SectionTitle>
                        {detail.history?.length ? (
                            <ol className="flex flex-col gap-0">
                                {detail.history.map((h, i) => (
                                    <li key={i} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ background: TONE_DOT[h.status] || 'var(--ui-text-muted)' }} />
                                            {i < detail.history.length - 1 ? <span className="w-px grow my-1" style={{ background: 'var(--ui-border)' }} /> : null}
                                        </div>
                                        <div className="flex flex-col pb-3">
                                            <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>{h.status}</span>
                                            <span className="ui-muted text-xs">
                                                {fmtDateTime(h.created_at)}
                                                {h.changed_by_name ? ` · by ${h.changed_by_name}` : ''}
                                                {h.note ? ` · ${h.note}` : ''}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ) : <p className="ui-muted text-sm">No history recorded.</p>}
                    </div>
                )}
            </Drawer>
        </div>
    )
}

function SectionTitle({ children }) {
    return <span className="ui-muted text-xs font-semibold uppercase tracking-wider -mb-2">{children}</span>
}

function Meta({ label, value, span = false }) {
    return (
        <div className={`flex flex-col gap-0.5 ${span ? 'col-span-2' : ''}`}>
            <span className="ui-muted text-xs">{label}</span>
            <span className="font-medium break-words" style={{ color: 'var(--ui-text)' }}>{value}</span>
        </div>
    )
}

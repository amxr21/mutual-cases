'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge, FormField } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import Select from '../ui/Select'
import ReportLink from '../ui/ReportLink'

const STATUS_TONE = { requested: 'gold', approved: 'blue', completed: 'green', rejected: 'red' }
const FILTERS = [
    { key: 'requested', label: 'Requested' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
]
const RESOLUTIONS = [
    { label: 'Refund (original method)', value: 'refund' },
    { label: 'Store credit', value: 'store_credit' },
    { label: 'Exchange', value: 'exchange' },
]
const fmtDate = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function AdminReturns() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [filter, setFilter] = useState('requested')
    const [detail, setDetail] = useState(null)
    const [form, setForm] = useState({ resolution: 'refund', restock: true, refund_amount: '', admin_note: '' })
    const [busy, setBusy] = useState(false)

    const load = async () => {
        setStatus('loading')
        const qs = filter === 'all' ? '' : `?status=${filter}`
        const r = await getJSON(`/admin/returns${qs}`)
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

    const open = async (id) => {
        setDetail({ loading: true })
        const r = await getJSON(`/admin/returns/${id}`)
        if (!r.ok) { toast.error('Failed to load return'); setDetail(null); return }
        setDetail(r.data)
        const itemsValue = (r.data.items || []).reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0)
        setForm({ resolution: 'refund', restock: true, refund_amount: String(itemsValue), admin_note: '' })
    }

    const approve = async () => {
        if (!detail) return
        setBusy(true)
        const payload = {
            resolution: form.resolution,
            restock: form.restock,
            admin_note: form.admin_note,
            ...(form.resolution !== 'exchange' && form.refund_amount !== '' ? { refund_amount: Number(form.refund_amount) } : {}),
        }
        const r = await patchJSON(`/admin/returns/${detail.id}/approve`, payload)
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Approve failed'); return }
        toast.success(`Return approved — ${form.resolution.replace('_', ' ')}`)
        setDetail(null); load()
    }

    const reject = async () => {
        if (!detail) return
        setBusy(true)
        const r = await patchJSON(`/admin/returns/${detail.id}/reject`, { admin_note: form.admin_note })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Reject failed'); return }
        toast.success('Return rejected')
        setDetail(null); load()
    }

    const columns = [
        { key: 'id', header: 'RMA', sortable: true, render: (r) => `#${r.id}` },
        { key: 'order_number', header: 'Order', sortable: true },
        { key: 'customer_name', header: 'Customer', sortable: true, render: (r) => r.customer_name || 'Guest' },
        { key: 'item_count', header: 'Items', align: 'center' },
        { key: 'reason', header: 'Reason', render: (r) => r.reason || <span className="ui-muted">—</span> },
        { key: 'created_at', header: 'Requested', sortable: true, render: (r) => new Date(r.created_at).toLocaleDateString() },
        { key: 'status', header: 'Status', sortable: true, render: (r) => (
            <span className="inline-flex items-center gap-1.5">
                <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge>
                {r.resolution ? <span className="ui-muted text-xs">{r.resolution.replace('_', ' ')}</span> : null}
            </span>
        ) },
    ]

    const loaded = detail && !detail.loading
    const pending = loaded && detail.status === 'requested'

    return (
        <div>
            <PageHeader title="Returns" subtitle="Approve, restock, and refund customer returns" actions={<ReportLink report="returns-detail" />} />

            <div className="flex flex-wrap gap-2 mb-4">
                {FILTERS.map((f) => {
                    const active = filter === f.key
                    return (
                        <button key={f.key} onClick={() => setFilter(f.key)} className="ui-btn"
                            style={{ background: active ? 'var(--ui-primary)' : 'transparent', color: active ? 'var(--ui-primary-contrast)' : 'var(--ui-text)', border: active ? 'none' : '1px solid var(--ui-border)' }}>
                            {f.label}
                        </button>
                    )
                })}
            </div>

            {status === 'loading' ? <Loader rows={6} /> : null}
            {status === 'error' ? <AdminMessage variant="error" title="Couldn't load returns" message="Please refresh to try again." /> : null}
            {status === 'ready' ? (
                <DataTable
                    columns={columns}
                    rows={rows}
                    searchKeys={['order_number', 'customer_name', 'customer_email', 'reason']}
                    searchPlaceholder="Search returns…"
                    emptyText="No returns in this view."
                    rowActions={(r) => <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => open(r.id)}>Review</button>}
                />
            ) : null}

            <Drawer open={!!detail} onClose={() => setDetail(null)} title={loaded ? `Return #${detail.id}` : 'Return'} width="34rem"
                footer={pending ? (
                    <>
                        <button className="ui-btn ui-btn-danger" disabled={busy} onClick={reject}>Reject</button>
                        <button className="ui-btn ui-btn-primary" disabled={busy} onClick={approve}>{busy ? 'Saving…' : 'Approve return'}</button>
                    </>
                ) : null}
            >
                {!loaded ? <Loader rows={6} /> : (
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <Badge tone={STATUS_TONE[detail.status] || 'neutral'}>{detail.status}</Badge>
                            <span className="ui-muted text-sm">{detail.order_number}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <Meta label="Customer" value={`${detail.customer_name || 'Guest'}`} />
                            <Meta label="Email" value={detail.customer_email || '—'} />
                            <Meta label="Order total" value={`${detail.total} AED`} />
                            <Meta label="Payment" value={detail.payment_method} />
                            <Meta label="Requested" value={fmtDate(detail.created_at)} />
                            {detail.resolved_at ? <Meta label="Resolved" value={fmtDate(detail.resolved_at)} /> : null}
                        </div>

                        {detail.reason ? <Meta label="Reason" value={detail.reason} /> : null}

                        <div>
                            <span className="ui-muted text-xs font-semibold uppercase">Items to return</span>
                            <div className="flex flex-col gap-2 mt-2">
                                {detail.items?.map((it) => (
                                    <div key={it.product_id} className="flex justify-between text-sm ui-surface p-2.5">
                                        <span className="capitalize" style={{ color: 'var(--ui-text)' }}>{it.category} {it.model} ×{it.quantity}</span>
                                        <span className="font-semibold" style={{ color: 'var(--ui-text)' }}>{Number(it.price) * Number(it.quantity)} AED</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {pending ? (
                            <div className="rounded-lg p-3 flex flex-col gap-3" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                                <span className="ui-muted text-xs font-semibold uppercase">Resolution</span>
                                <FormField label="How to resolve"><Select value={form.resolution} onChange={(v) => setForm((f) => ({ ...f, resolution: v }))} options={RESOLUTIONS} /></FormField>
                                {form.resolution !== 'exchange' ? (
                                    <FormField label="Refund / credit amount (AED)"><input type="number" value={form.refund_amount} onChange={(e) => setForm((f) => ({ ...f, refund_amount: e.target.value }))} className="ui-input" /></FormField>
                                ) : null}
                                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ui-text)' }}>
                                    <input type="checkbox" checked={form.restock} onChange={(e) => setForm((f) => ({ ...f, restock: e.target.checked }))} /> Restock returned items
                                </label>
                                <FormField label="Admin note (optional)"><input value={form.admin_note} onChange={(e) => setForm((f) => ({ ...f, admin_note: e.target.value }))} className="ui-input" /></FormField>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {detail.resolution ? <Meta label="Resolution" value={detail.resolution.replace('_', ' ')} /> : null}
                                <Meta label="Refund amount" value={`${detail.refund_amount} AED`} />
                                <Meta label="Restocked" value={detail.restock ? 'Yes' : 'No'} />
                                {detail.admin_note ? <Meta label="Admin note" value={detail.admin_note} span /> : null}
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    )
}

function Meta({ label, value, span = false }) {
    return (
        <div className={`flex flex-col gap-0.5 ${span ? 'col-span-2' : ''}`}>
            <span className="ui-muted text-xs">{label}</span>
            <span className="font-medium break-words capitalize" style={{ color: 'var(--ui-text)' }}>{value}</span>
        </div>
    )
}

'use client'
import { useEffect, useState } from 'react'
import { getJSON, postJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge, FormField } from '../ui/primitives'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import Select from '../ui/Select'

const REASONS = [
    { label: 'Restock', value: 'restock' },
    { label: 'Correction', value: 'correction' },
    { label: 'Damaged', value: 'damaged' },
    { label: 'Lost', value: 'lost' },
    { label: 'Return', value: 'return' },
    { label: 'Manual', value: 'manual' },
]
const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.value, r.label]))
const fmtDateTime = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function AdminInventory() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [detail, setDetail] = useState(null)
    const [history, setHistory] = useState([])
    const [adj, setAdj] = useState({ delta: '', reason: 'restock', note: '' })
    const [threshold, setThresholdVal] = useState('')
    const [busy, setBusy] = useState(false)

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/inventory')
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const open = async (p) => {
        setDetail(p)
        setAdj({ delta: '', reason: 'restock', note: '' })
        setThresholdVal(String(p.low_stock_threshold))
        setHistory([])
        const r = await getJSON(`/admin/inventory/${p.id}/adjustments`)
        if (r.ok && Array.isArray(r.data)) setHistory(r.data)
    }

    const refreshRow = (updated) => setRows((prev) => prev.map((x) => x.id === updated.id ? { ...x, ...updated } : x))

    const submitAdjust = async () => {
        if (!detail) return
        const delta = Number(adj.delta)
        if (!Number.isInteger(delta) || delta === 0) { toast.error('Enter a non-zero whole number'); return }
        setBusy(true)
        const r = await postJSON(`/admin/inventory/${detail.id}/adjust`, { delta, reason: adj.reason, note: adj.note })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Adjustment failed'); return }
        toast.success('Stock adjusted')
        const qty = r.data.quantity
        const updated = { ...detail, quantity: qty, available: qty - Number(detail.reserved), outOfStock: qty <= 0, lowStock: qty > 0 && qty <= Number(detail.low_stock_threshold) }
        setDetail(updated); refreshRow(updated); setAdj({ delta: '', reason: 'restock', note: '' })
        const h = await getJSON(`/admin/inventory/${detail.id}/adjustments`)
        if (h.ok) setHistory(h.data)
    }

    const saveThreshold = async () => {
        if (!detail) return
        const t = Number(threshold)
        if (!Number.isInteger(t) || t < 0) { toast.error('Enter a valid threshold'); return }
        setBusy(true)
        const r = await patchJSON(`/admin/inventory/${detail.id}/threshold`, { low_stock_threshold: t })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success('Threshold updated')
        const updated = { ...detail, low_stock_threshold: t, lowStock: detail.quantity > 0 && detail.quantity <= t }
        setDetail(updated); refreshRow(updated)
    }

    const statusBadge = (p) => p.outOfStock
        ? <Badge tone="red">Out of stock</Badge>
        : p.lowStock ? <Badge tone="gold">Low</Badge> : <Badge tone="green">In stock</Badge>

    const columns = [
        { key: 'product', header: 'Product', render: (p) => <span className="capitalize">{p.category} {p.model}</span> },
        { key: 'type', header: 'Type', sortable: true, render: (p) => <span className="capitalize">{p.type}</span> },
        { key: 'quantity', header: 'In stock', sortable: true, align: 'center' },
        { key: 'reserved', header: 'Reserved', sortable: true, align: 'center', render: (p) => p.reserved || 0 },
        { key: 'available', header: 'Available', sortable: true, align: 'center', render: (p) => <span className="font-semibold">{p.available}</span> },
        { key: 'low_stock_threshold', header: 'Threshold', align: 'center' },
        { key: 'status', header: 'Status', render: (p) => statusBadge(p) },
    ]

    if (status === 'loading') return <p className="ui-muted">Loading…</p>
    if (status === 'error') return <p style={{ color: 'var(--ui-danger)' }}>Couldn&apos;t load inventory.</p>

    const lowCount = rows.filter((r) => r.lowStock || r.outOfStock).length

    return (
        <div>
            <PageHeader title="Inventory" subtitle={`${rows.length} products · ${lowCount} need attention`} />

            <DataTable
                columns={columns}
                rows={rows}
                searchKeys={['model', 'category', 'type']}
                searchPlaceholder="Search inventory…"
                rowActions={(p) => (
                    <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => open(p)}>Manage</button>
                )}
            />

            <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.category} ${detail.model}` : ''} width="34rem">
                {detail ? (
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <Stat label="In stock" value={detail.quantity} />
                            <Stat label="Reserved" value={detail.reserved || 0} />
                            <Stat label="Available" value={detail.available} tone="var(--ui-primary)" />
                        </div>
                        <div className="flex justify-center">{statusBadge(detail)}</div>

                        {/* Adjust stock */}
                        <div className="rounded-lg p-3 flex flex-col gap-3" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                            <span className="ui-muted text-xs font-semibold uppercase">Adjust stock</span>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Change (+/-)"><input type="number" value={adj.delta} onChange={(e) => setAdj((a) => ({ ...a, delta: e.target.value }))} className="ui-input" placeholder="e.g. 10 or -2" /></FormField>
                                <FormField label="Reason"><Select value={adj.reason} onChange={(v) => setAdj((a) => ({ ...a, reason: v }))} options={REASONS} /></FormField>
                            </div>
                            <FormField label="Note (optional)"><input value={adj.note} onChange={(e) => setAdj((a) => ({ ...a, note: e.target.value }))} className="ui-input" /></FormField>
                            <div className="flex justify-end">
                                <button className="ui-btn ui-btn-primary !py-1.5" onClick={submitAdjust} disabled={busy}>{busy ? 'Saving…' : 'Apply adjustment'}</button>
                            </div>
                        </div>

                        {/* Threshold */}
                        <div className="flex items-end gap-3">
                            <FormField label="Low-stock threshold" hint="Alert when stock ≤ this"><input type="number" value={threshold} onChange={(e) => setThresholdVal(e.target.value)} className="ui-input" /></FormField>
                            <button className="ui-btn ui-btn-ghost" onClick={saveThreshold} disabled={busy}>Save</button>
                        </div>

                        {/* Adjustment history */}
                        <div className="flex flex-col gap-2">
                            <span className="ui-muted text-xs font-semibold uppercase">Adjustment history</span>
                            {history.length === 0 ? <p className="ui-muted text-sm">No adjustments yet.</p> : history.map((h, i) => (
                                <div key={i} className="flex items-center justify-between text-sm ui-surface p-2.5">
                                    <div className="flex flex-col">
                                        <span style={{ color: 'var(--ui-text)' }}>
                                            <span className="font-semibold">{h.delta > 0 ? `+${h.delta}` : h.delta}</span> · {REASON_LABEL[h.reason] || h.reason}
                                            {h.note ? ` · ${h.note}` : ''}
                                        </span>
                                        <span className="ui-muted text-xs">{fmtDateTime(h.created_at)}{h.adjusted_by_name ? ` · ${h.adjusted_by_name}` : ''}</span>
                                    </div>
                                    <span className="ui-muted">→ {h.resulting_qty}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </Drawer>
        </div>
    )
}

function Stat({ label, value, tone }) {
    return (
        <div className="flex flex-col">
            <span className="text-2xl font-bold" style={{ color: tone || 'var(--ui-text)' }}>{value}</span>
            <span className="ui-muted text-xs">{label}</span>
        </div>
    )
}

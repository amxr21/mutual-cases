'use client'
import { useEffect, useState } from 'react'
import { getJSON, postJSON, patchJSON, deleteJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge, FormField } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import RefreshButton from '../ui/RefreshButton'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import ConfirmDialog from '../ui/ConfirmDialog'
import Select from '../ui/Select'

const TYPES = [
    { label: 'Percent off (%)', value: 'percent' },
    { label: 'Fixed amount (AED)', value: 'fixed' },
    { label: 'Free shipping', value: 'free_shipping' },
]
const TYPE_LABEL = { percent: '% off', fixed: 'AED off', free_shipping: 'Free shipping' }
const EMPTY = { code: '', type: 'percent', value: '', min_spend: '', max_uses: '', per_customer_limit: '', starts_at: '', expires_at: '', active: true, first_order_only: false, featured: false }
const toDateInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : ''

export default function AdminDiscounts() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [confirm, setConfirm] = useState(null)

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/discounts')
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

    const openNew = () => { setForm(EMPTY); setEditingId(null); setDrawerOpen(true) }
    const openEdit = (d) => {
        setEditingId(d.id)
        setForm({
            code: d.code, type: d.type, value: String(d.value ?? ''), min_spend: String(d.min_spend ?? ''),
            max_uses: d.max_uses ?? '', per_customer_limit: d.per_customer_limit ?? '',
            starts_at: toDateInput(d.starts_at), expires_at: toDateInput(d.expires_at), active: !!d.active,
            first_order_only: !!d.first_order_only, featured: !!d.featured,
        })
        setDrawerOpen(true)
    }

    const submit = async () => {
        if (!editingId && !form.code.trim()) { toast.error('Code is required'); return }
        const payload = {
            type: form.type,
            value: Number(form.value) || 0,
            min_spend: Number(form.min_spend) || 0,
            max_uses: form.max_uses === '' ? null : Number(form.max_uses),
            per_customer_limit: form.per_customer_limit === '' ? null : Number(form.per_customer_limit),
            starts_at: form.starts_at || null,
            expires_at: form.expires_at || null,
            active: form.active,
            first_order_only: form.first_order_only,
            featured: form.featured,
        }
        setSaving(true)
        const r = editingId
            ? await patchJSON(`/admin/discounts/${editingId}`, payload)
            : await postJSON('/admin/discounts', { code: form.code.trim().toUpperCase(), ...payload })
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success(editingId ? 'Discount updated' : 'Discount created')
        setDrawerOpen(false); load()
    }

    const doDelete = async () => {
        if (!confirm) return
        setSaving(true)
        const r = await deleteJSON(`/admin/discounts/${confirm.id}`)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Delete failed'); return }
        toast.success('Discount deleted')
        setRows((prev) => prev.filter((d) => d.id !== confirm.id))
        setConfirm(null)
    }

    const valueLabel = (d) => d.type === 'percent' ? `${d.value}%` : d.type === 'fixed' ? `${d.value} AED` : '—'
    const isExpired = (d) => d.expires_at && new Date(d.expires_at) < new Date()

    const columns = [
        { key: 'code', header: 'Code', sortable: true, render: (d) => <span className="font-mono font-semibold">{d.code}</span> },
        { key: 'type', header: 'Type', render: (d) => TYPE_LABEL[d.type] },
        { key: 'value', header: 'Value', render: (d) => valueLabel(d) },
        { key: 'min_spend', header: 'Min spend', render: (d) => Number(d.min_spend) ? `${d.min_spend} AED` : '—' },
        { key: 'used_count', header: 'Used', align: 'center', sortable: true, render: (d) => `${d.used_count}${d.max_uses ? ` / ${d.max_uses}` : ''}` },
        { key: 'expires_at', header: 'Expires', render: (d) => d.expires_at ? new Date(d.expires_at).toLocaleDateString() : '—' },
        { key: 'active', header: 'Status', render: (d) => (
            !d.active ? <Badge tone="neutral">Inactive</Badge> : isExpired(d) ? <Badge tone="red">Expired</Badge> : <Badge tone="green">Active</Badge>
        ) },
    ]

    if (status === 'loading') return <Loader rows={6} />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load discounts" message="Please refresh to try again." />

    return (
        <div>
            <PageHeader title="Discounts" subtitle={`${rows.length} codes`} actions={<><RefreshButton onRefresh={load} /><button className="ui-btn ui-btn-primary" onClick={openNew}>+ New discount</button></>} />

            <DataTable
                columns={columns}
                rows={rows}
                searchKeys={['code', 'type']}
                searchPlaceholder="Search discounts…"
                emptyText="No discount codes yet."
                rowActions={(d) => (
                    <div className="flex gap-2 justify-end">
                        <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openEdit(d)}>Edit</button>
                        <button className="ui-btn ui-btn-danger !py-1 !px-3" onClick={() => setConfirm(d)}>Delete</button>
                    </div>
                )}
            />

            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? `Edit ${form.code}` : 'New discount'}
                footer={<><button className="ui-btn ui-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="ui-btn ui-btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
            >
                <div className="flex flex-col gap-4">
                    {!editingId ? <FormField label="Code" hint="Customers type this at checkout"><input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="ui-input font-mono" placeholder="WELCOME10" /></FormField> : null}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Type"><Select value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={TYPES} /></FormField>
                        {form.type !== 'free_shipping' ? (
                            <FormField label={form.type === 'percent' ? 'Percent (%)' : 'Amount (AED)'}><input type="number" value={form.value} onChange={set('value')} className="ui-input" /></FormField>
                        ) : <div />}
                    </div>
                    <FormField label="Minimum spend (AED)" hint="0 = no minimum"><input type="number" value={form.min_spend} onChange={set('min_spend')} className="ui-input" /></FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Max total uses" hint="Blank = unlimited"><input type="number" value={form.max_uses} onChange={set('max_uses')} className="ui-input" /></FormField>
                        <FormField label="Per-customer limit" hint="Blank = unlimited"><input type="number" value={form.per_customer_limit} onChange={set('per_customer_limit')} className="ui-input" /></FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Starts"><input type="date" value={form.starts_at} onChange={set('starts_at')} className="ui-input" /></FormField>
                        <FormField label="Expires"><input type="date" value={form.expires_at} onChange={set('expires_at')} className="ui-input" /></FormField>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ui-text)' }}>
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active
                        </label>
                        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ui-text)' }}>
                            <input type="checkbox" checked={form.first_order_only} onChange={(e) => setForm((f) => ({ ...f, first_order_only: e.target.checked }))} /> First-order only <span className="ui-muted text-xs">(new customers)</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ui-text)' }}>
                            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured <span className="ui-muted text-xs">(show as a banner on the store)</span>
                        </label>
                    </div>
                </div>
            </Drawer>

            <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} busy={saving}
                title="Delete discount?" message={confirm ? `This removes code "${confirm.code}". Past orders that used it are unaffected.` : ''} confirmLabel="Delete" />
        </div>
    )
}

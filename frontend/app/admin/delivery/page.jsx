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

const EMPTY = {
    name: '', email: '', phone: '',
    vehicle_type: '', plate_number: '', license_number: '',
    zone: '', emirate: '', country: 'United Arab Emirates', status: 'active',
}

const STATUS_OPTS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'On shift', value: 'on_shift' },
]
const STATUS_TONE = { active: 'green', inactive: 'neutral', on_shift: 'blue' }
const STATUS_LABEL = { active: 'Active', inactive: 'Inactive', on_shift: 'On shift' }

const VEHICLES = ['Motorbike', 'Car', 'Van', 'Bicycle', 'Truck']
const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
// GCC member states — coverage country for delivery staff.
const GCC_COUNTRIES = [
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Kuwait',
    'Bahrain',
    'Oman',
]

export default function AdminDelivery() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [busy, setBusy] = useState(false)
    const [accessCode, setAccessCode] = useState('')
    const [confirm, setConfirm] = useState(null)

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/delivery')
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
    const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

    const openNew = () => { setForm(EMPTY); setEditingId(null); setAccessCode(''); setDrawerOpen(true) }
    const openEdit = (d) => {
        setEditingId(d.id)
        setAccessCode(d.access_code || '')
        setForm({
            name: d.name || '', email: d.email || '', phone: d.phone || '',
            vehicle_type: d.vehicle_type || '', plate_number: d.plate_number || '', license_number: d.license_number || '',
            zone: d.zone || '', emirate: d.emirate || '', country: d.country || 'United Arab Emirates', status: d.status || 'active',
        })
        setDrawerOpen(true)
    }

    const genCode = async () => {
        if (!editingId) return
        setBusy(true)
        const r = await postJSON(`/admin/delivery/${editingId}/access-code`, {})
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Failed to generate code'); return }
        setAccessCode(r.data.access_code)
        setRows((prev) => prev.map((x) => x.id === editingId ? { ...x, access_code: r.data.access_code } : x))
        toast.success('Access code generated')
    }

    const copyCode = () => {
        if (!accessCode) return
        try { navigator.clipboard.writeText(accessCode); toast.success('Code copied') } catch { /* ignore */ }
    }

    const submit = async () => {
        if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return }
        setSaving(true)
        const r = editingId ? await patchJSON(`/admin/delivery/${editingId}`, form) : await postJSON('/admin/delivery', form)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success(editingId ? 'Delivery person updated' : 'Delivery person created')
        setDrawerOpen(false)
        load()
    }

    const doDelete = async () => {
        if (!confirm) return
        setSaving(true)
        const r = await deleteJSON(`/admin/delivery/${confirm.id}`)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Delete failed'); return }
        toast.success('Delivery person deleted')
        setRows((prev) => prev.filter((d) => d.id !== confirm.id))
        setConfirm(null)
    }

    const columns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'phone', header: 'Phone', render: (d) => d.phone || <span className="ui-muted">—</span> },
        { key: 'vehicle_type', header: 'Vehicle', render: (d) => d.vehicle_type || <span className="ui-muted">—</span> },
        { key: 'plate_number', header: 'Plate', render: (d) => d.plate_number || <span className="ui-muted">—</span> },
        { key: 'zone', header: 'Coverage', render: (d) => [d.zone, d.emirate].filter(Boolean).join(', ') || <span className="ui-muted">—</span> },
        { key: 'status', header: 'Status', sortable: true, render: (d) => <Badge tone={STATUS_TONE[d.status] || 'neutral'}>{STATUS_LABEL[d.status] || d.status}</Badge> },
    ]

    if (status === 'loading') return <Loader rows={6} />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load delivery staff" message="Please refresh to try again." />

    return (
        <div>
            <PageHeader
                title="Delivery"
                subtitle={`${rows.length} delivery staff`}
                actions={<><RefreshButton onRefresh={load} /><button className="ui-btn ui-btn-primary" onClick={openNew}>+ New delivery person</button></>}
            />

            <DataTable
                columns={columns}
                rows={rows}
                searchKeys={['name', 'email', 'phone', 'vehicle_type', 'plate_number', 'zone', 'emirate']}
                searchPlaceholder="Search delivery staff…"
                emptyText="No delivery staff yet."
                rowActions={(d) => (
                    <div className="flex gap-2 justify-end">
                        <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openEdit(d)}>Edit</button>
                        <button className="ui-btn ui-btn-danger !py-1 !px-3" onClick={() => setConfirm(d)}>Delete</button>
                    </div>
                )}
            />

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={editingId ? 'Edit delivery person' : 'New delivery person'}
                footer={
                    <>
                        <button className="ui-btn ui-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
                        <button className="ui-btn ui-btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <SectionLabel>Contact</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Name"><input value={form.name} onChange={set('name')} className="ui-input" /></FormField>
                        <FormField label="Phone"><input value={form.phone} onChange={set('phone')} className="ui-input" placeholder="+971…" /></FormField>
                    </div>
                    <FormField label="Email"><input value={form.email} onChange={set('email')} className="ui-input" type="email" /></FormField>

                    <SectionLabel>Vehicle</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Vehicle type"><Select value={form.vehicle_type} onChange={setV('vehicle_type')} options={VEHICLES} placeholder="Select…" /></FormField>
                        <FormField label="Plate number"><input value={form.plate_number} onChange={set('plate_number')} className="ui-input" /></FormField>
                    </div>
                    <FormField label="License number"><input value={form.license_number} onChange={set('license_number')} className="ui-input" /></FormField>

                    <SectionLabel>Coverage</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Country"><Select value={form.country} onChange={setV('country')} options={GCC_COUNTRIES} placeholder="Select…" /></FormField>
                        <FormField label="Emirate" hint="UAE only"><Select value={form.emirate} onChange={setV('emirate')} options={EMIRATES} placeholder="Select…" /></FormField>
                    </div>
                    <FormField label="Zone / area" hint="Specific area(s) they cover"><input value={form.zone} onChange={set('zone')} className="ui-input" placeholder="e.g. Marina, JBR" /></FormField>

                    <SectionLabel>Availability</SectionLabel>
                    <FormField label="Status"><Select value={form.status} onChange={setV('status')} options={STATUS_OPTS} /></FormField>

                    {/* Portal access code — only for an existing (saved) driver. */}
                    {editingId ? (
                        <>
                            <SectionLabel>Portal access</SectionLabel>
                            <div className="rounded-lg p-3 flex flex-col gap-2" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                                <p className="ui-muted text-xs">The driver signs into their portal at <code>/delivery</code> with this code.</p>
                                <div className="flex items-center gap-2">
                                    <input readOnly value={accessCode || '— not generated —'} className="ui-input font-mono tracking-widest" />
                                    {accessCode ? <button className="ui-btn ui-btn-ghost !px-3" onClick={copyCode}>Copy</button> : null}
                                </div>
                                <div className="flex justify-end">
                                    <button className="ui-btn ui-btn-ghost !py-1.5" onClick={genCode} disabled={busy}>
                                        {busy ? '…' : accessCode ? 'Regenerate code' : 'Generate code'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </Drawer>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={doDelete}
                busy={saving}
                title="Delete delivery person?"
                message={confirm ? `This permanently removes ${confirm.name} and their delivery profile. This can't be undone.` : ''}
                confirmLabel="Delete"
            />
        </div>
    )
}

function SectionLabel({ children }) {
    return <span className="ui-muted text-[0.7rem] font-semibold uppercase tracking-wider -mb-1">{children}</span>
}

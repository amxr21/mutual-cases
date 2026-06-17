'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON, deleteJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge, FormField } from '../ui/primitives'
import Loader from '../ui/Loader'
import RefreshButton from '../ui/RefreshButton'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import ConfirmDialog from '../ui/ConfirmDialog'

const EMPTY = { name: '', email: '', phone: '', address_line: '', area: '', city: '', country: '' }

export default function AdminCustomers() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [detail, setDetail] = useState(null)   // full customer detail (with orders)
    const [form, setForm] = useState(EMPTY)
    const [busy, setBusy] = useState(false)
    const [confirm, setConfirm] = useState(null)  // customer pending delete

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/customers')
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

    const openDetail = async (id) => {
        setDetail({ loading: true, id })
        const r = await getJSON(`/admin/customers/${id}`)
        if (!r.ok) { toast.error(r.error?.message || 'Failed to load customer'); setDetail(null); return }
        setDetail(r.data)
        setForm({
            name: r.data.name || '', email: r.data.email || '', phone: r.data.phone || '',
            address_line: r.data.address_line || '', area: r.data.area || '',
            city: r.data.city || '', country: r.data.country || '',
        })
    }

    const saveProfile = async () => {
        if (!detail) return
        if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return }
        setBusy(true)
        const r = await patchJSON(`/admin/customers/${detail.id}`, form)
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success('Customer updated')
        setRows((prev) => prev.map((u) => u.id === detail.id ? { ...u, name: form.name, email: form.email, phone: form.phone } : u))
        setDetail((d) => d ? { ...d, ...form } : d)
    }

    const changeRole = async (role) => {
        if (!detail) return
        setBusy(true)
        const r = await patchJSON(`/admin/customers/${detail.id}/role`, { role })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Role update failed'); return }
        toast.success(`Role set to ${role}`)
        setRows((prev) => prev.map((u) => u.id === detail.id ? { ...u, role } : u))
        setDetail((d) => d ? { ...d, role } : d)
    }

    const doDelete = async () => {
        if (!confirm) return
        setBusy(true)
        const r = await deleteJSON(`/admin/customers/${confirm.id}`)
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Delete failed'); return }
        toast.success('Customer deleted')
        setRows((prev) => prev.filter((u) => u.id !== confirm.id))
        if (detail?.id === confirm.id) setDetail(null)
        setConfirm(null)
    }

    const columns = [
        { key: 'id', header: 'ID', sortable: true },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'phone', header: 'Phone', render: (u) => u.phone || <span className="ui-muted">—</span> },
        { key: 'role', header: 'Role', sortable: true, render: (u) => <Badge tone={u.role === 'admin' ? 'blue' : 'neutral'}>{u.role}</Badge> },
        { key: 'order_count', header: 'Orders', sortable: true, align: 'center' },
        { key: 'spent', header: 'Spent', sortable: true, align: 'right', render: (u) => `${Number(u.spent).toLocaleString()} AED` },
        { key: 'created_at', header: 'Joined', sortable: true, render: (u) => new Date(u.created_at).toLocaleDateString() },
    ]

    if (status === 'loading') return <Loader rows={6} />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load customers" message="Something went wrong fetching this data. Please refresh to try again." />

    const loaded = detail && !detail.loading

    return (
        <div>
            <PageHeader title="Customers" subtitle={`${rows.length} total`} actions={<RefreshButton onRefresh={load} />} />
            <DataTable
                columns={columns}
                rows={rows}
                searchKeys={['name', 'email', 'phone', 'role']}
                searchPlaceholder="Search customers…"
                rowActions={(u) => (
                    <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openDetail(u.id)}>Manage</button>
                )}
            />

            <Drawer
                open={!!detail}
                onClose={() => setDetail(null)}
                title={loaded ? `Customer #${detail.id}` : 'Customer'}
                footer={loaded ? (
                    <>
                        <button className="ui-btn ui-btn-danger" disabled={busy} onClick={() => setConfirm(detail)}>Delete</button>
                        <button className="ui-btn ui-btn-primary" disabled={busy} onClick={saveProfile}>{busy ? 'Saving…' : 'Save changes'}</button>
                    </>
                ) : null}
            >
                {!loaded ? <Loader rows={6} /> : (
                    <div className="flex flex-col gap-5">
                        {/* Stats */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'var(--ui-surface-2)' }}>
                                {detail.profile_picture ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={detail.profile_picture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-semibold" style={{ color: 'var(--ui-text-muted)' }}>{(detail.name || '?').slice(0, 1).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm ui-muted">{detail.order_count} orders · {Number(detail.spent).toLocaleString()} AED spent</span>
                                <span className="text-xs ui-muted">Joined {new Date(detail.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Editable profile / logistics */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Name"><input value={form.name} onChange={set('name')} className="ui-input" /></FormField>
                            <FormField label="Phone"><input value={form.phone} onChange={set('phone')} className="ui-input" placeholder="+971…" /></FormField>
                        </div>
                        <FormField label="Email"><input value={form.email} onChange={set('email')} className="ui-input" type="email" /></FormField>
                        <FormField label="Address"><input value={form.address_line} onChange={set('address_line')} className="ui-input" placeholder="Street / building" /></FormField>
                        <div className="grid grid-cols-3 gap-3">
                            <FormField label="Area"><input value={form.area} onChange={set('area')} className="ui-input" /></FormField>
                            <FormField label="City"><input value={form.city} onChange={set('city')} className="ui-input" /></FormField>
                            <FormField label="Country"><input value={form.country} onChange={set('country')} className="ui-input" /></FormField>
                        </div>

                        {/* Role control */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Role</span>
                            <div className="flex items-center gap-2">
                                <Badge tone={detail.role === 'admin' ? 'blue' : 'neutral'}>{detail.role}</Badge>
                                <button
                                    className="ui-btn ui-btn-ghost !py-1 !px-3"
                                    disabled={busy}
                                    onClick={() => changeRole(detail.role === 'admin' ? 'customer' : 'admin')}
                                >
                                    {detail.role === 'admin' ? 'Demote to customer' : 'Promote to admin'}
                                </button>
                            </div>
                        </div>

                        {/* Recent orders */}
                        {detail.orders?.length ? (
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-semibold" style={{ color: 'var(--ui-text)' }}>Recent orders</span>
                                {detail.orders.map((o) => (
                                    <div key={o.order_number} className="flex items-center justify-between text-sm ui-surface p-2.5">
                                        <span style={{ color: 'var(--ui-text)' }}>{o.order_number}</span>
                                        <span className="ui-muted">{o.status}</span>
                                        <span className="font-semibold" style={{ color: 'var(--ui-text)' }}>{o.total} AED</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="ui-muted text-sm">No orders yet.</p>}
                    </div>
                )}
            </Drawer>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={doDelete}
                busy={busy}
                title="Delete customer?"
                message={confirm ? `This permanently deletes ${confirm.name}'s account, cart, likes, and reviews. This can't be undone.` : ''}
                confirmLabel="Delete account"
            />
        </div>
    )
}

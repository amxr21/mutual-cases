'use client'
import { useEffect, useState } from 'react'
import { getJSON, postJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge, FormField } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import RefreshButton from '../ui/RefreshButton'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import Select from '../ui/Select'
import { canManageStaff } from '../lib/permissions'

const ROLES = [
    { label: 'Owner', value: 'owner' },
    { label: 'Manager', value: 'manager' },
    { label: 'Fulfillment', value: 'fulfillment' },
    { label: 'Support', value: 'support' },
]
const ROLE_TONE = { owner: 'blue', manager: 'green', fulfillment: 'gold', support: 'neutral' }
const ROLE_DESC = {
    owner: 'Full access, including staff roles',
    manager: 'Everything except staff management',
    fulfillment: 'Orders, delivery, inventory, returns',
    support: 'Reviews, customers, returns, orders',
}
const fmtDateTime = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function AdminStaff() {
    const toast = useToast()
    const canManage = canManageStaff() // only the owner may add staff / change roles
    const [tab, setTab] = useState('staff')
    const [staff, setStaff] = useState([])
    const [audit, setAudit] = useState([])
    const [status, setStatus] = useState('loading')
    const [editing, setEditing] = useState(null)   // staff member being role-edited
    const [roleDraft, setRoleDraft] = useState('owner')
    const [saving, setSaving] = useState(false)
    const [adding, setAdding] = useState(false)
    const [newStaff, setNewStaff] = useState({ name: '', email: '', staff_role: 'manager' })

    const load = async () => {
        setStatus('loading')
        const [s, a] = await Promise.all([getJSON('/admin/staff'), getJSON('/admin/audit-log')])
        if (s.ok && Array.isArray(s.data)) setStaff(s.data)
        if (a.ok && Array.isArray(a.data)) setAudit(a.data)
        setStatus(s.ok ? 'ready' : 'error')
    }
    useEffect(() => { load() }, [])

    const openEdit = (u) => { setEditing(u); setRoleDraft(u.staff_role || 'owner') }

    const addStaff = async () => {
        if (!newStaff.name.trim() || !newStaff.email.trim()) { toast.error('Name and email are required'); return }
        setSaving(true)
        const r = await postJSON('/admin/staff', newStaff)
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Failed to add staff'); return }
        toast.success('Staff member added — they get access when they sign in with Google')
        setAdding(false); setNewStaff({ name: '', email: '', staff_role: 'manager' })
        load()
    }

    const saveRole = async () => {
        if (!editing) return
        setSaving(true)
        const r = await patchJSON(`/admin/staff/${editing.id}/role`, { staff_role: roleDraft })
        setSaving(false)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success('Role updated')
        setStaff((prev) => prev.map((u) => u.id === editing.id ? { ...u, staff_role: roleDraft } : u))
        setEditing(null)
    }

    const staffColumns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'staff_role', header: 'Role', sortable: true, render: (u) => <Badge tone={ROLE_TONE[u.staff_role] || 'neutral'}>{u.staff_role}</Badge> },
        { key: 'desc', header: 'Access', render: (u) => <span className="ui-muted text-xs">{ROLE_DESC[u.staff_role]}</span> },
    ]

    const auditColumns = [
        { key: 'created_at', header: 'When', sortable: true, render: (a) => fmtDateTime(a.created_at) },
        { key: 'user_name', header: 'By', render: (a) => a.user_name || '—' },
        { key: 'action', header: 'Action', sortable: true, render: (a) => <span className="font-mono text-xs">{a.action}</span> },
        { key: 'entity', header: 'Entity', render: (a) => a.entity ? `${a.entity}${a.entity_id ? ` #${a.entity_id}` : ''}` : '—' },
        { key: 'detail', header: 'Detail', render: (a) => a.detail || '—' },
    ]

    if (status === 'loading') return <Loader rows={6} />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load staff" message="Owner access may be required. Please refresh to try again." />

    return (
        <div>
            <PageHeader title="Staff & access" subtitle="Manage admin roles and review the activity log"
                actions={<><RefreshButton onRefresh={load} />{canManage ? <button className="ui-btn ui-btn-primary" onClick={() => setAdding(true)}>+ Add staff</button> : null}</>} />

            {!canManage ? (
                <AdminMessage variant="info" title="View only"
                    message="Only the owner can add staff or change roles. You can review the team and the activity log." />
            ) : null}

            <div className="flex gap-2 mb-4">
                {[['staff', 'Staff roles'], ['audit', 'Activity log']].map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)} className="ui-btn"
                        style={{ background: tab === k ? 'var(--ui-primary)' : 'transparent', color: tab === k ? 'var(--ui-primary-contrast)' : 'var(--ui-text)', border: tab === k ? 'none' : '1px solid var(--ui-border)' }}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'staff' ? (
                <DataTable columns={staffColumns} rows={staff} searchKeys={['name', 'email', 'staff_role']} searchPlaceholder="Search staff…"
                    rowActions={canManage ? (u) => <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openEdit(u)}>Change role</button> : undefined}
                />
            ) : (
                <DataTable columns={auditColumns} rows={audit} searchKeys={['user_name', 'action', 'entity', 'detail']} searchPlaceholder="Search activity…" pageSize={50} emptyText="No activity recorded yet." />
            )}

            <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing ? `Role — ${editing.name}` : ''}
                footer={<><button className="ui-btn ui-btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="ui-btn ui-btn-primary" onClick={saveRole} disabled={saving}>{saving ? 'Saving…' : 'Save role'}</button></>}
            >
                {editing ? (
                    <div className="flex flex-col gap-4">
                        <div className="text-sm ui-muted">{editing.email}</div>
                        <FormField label="Staff role"><Select value={roleDraft} onChange={setRoleDraft} options={ROLES} /></FormField>
                        <div className="rounded-lg p-3 text-sm" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                            <span className="font-medium" style={{ color: 'var(--ui-text)' }}>{ROLES.find((r) => r.value === roleDraft)?.label}</span>
                            <p className="ui-muted mt-1">{ROLE_DESC[roleDraft]}</p>
                        </div>
                    </div>
                ) : null}
            </Drawer>

            {/* Add staff */}
            <Drawer open={adding} onClose={() => setAdding(false)} title="Add staff member"
                footer={<><button className="ui-btn ui-btn-ghost" onClick={() => setAdding(false)}>Cancel</button><button className="ui-btn ui-btn-primary" onClick={addStaff} disabled={saving}>{saving ? 'Adding…' : 'Add staff'}</button></>}
            >
                <div className="flex flex-col gap-4">
                    <p className="ui-muted text-sm">They&apos;ll get admin access the moment they sign in with Google using this email.</p>
                    <FormField label="Name"><input value={newStaff.name} onChange={(e) => setNewStaff((s) => ({ ...s, name: e.target.value }))} className="ui-input" /></FormField>
                    <FormField label="Email" hint="Must match their Google account"><input type="email" value={newStaff.email} onChange={(e) => setNewStaff((s) => ({ ...s, email: e.target.value }))} className="ui-input" /></FormField>
                    <FormField label="Role"><Select value={newStaff.staff_role} onChange={(v) => setNewStaff((s) => ({ ...s, staff_role: v }))} options={ROLES} /></FormField>
                    <div className="rounded-lg p-3 text-sm" style={{ border: '1px solid var(--ui-border)', background: 'var(--ui-surface-2)' }}>
                        <p className="ui-muted">{ROLE_DESC[newStaff.staff_role]}</p>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}

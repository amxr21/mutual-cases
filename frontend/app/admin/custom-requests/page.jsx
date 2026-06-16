'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge } from '../ui/primitives'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import Select from '../ui/Select'

const STATUSES = ['pending', 'in_review', 'approved', 'rejected', 'completed']
const TONE = { pending: 'gold', in_review: 'blue', approved: 'green', rejected: 'red', completed: 'blue' }

export default function AdminCustomRequests() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [detail, setDetail] = useState(null)

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/custom-requests')
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const change = async (id, newStatus) => {
        const r = await patchJSON(`/admin/custom-requests/${id}/status`, { status: newStatus })
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success('Updated')
        setRows((prev) => prev.map((x) => x.id === id ? { ...x, status: newStatus } : x))
        setDetail((d) => d && d.id === id ? { ...d, status: newStatus } : d)
    }

    const columns = [
        { key: 'id', header: 'ID', sortable: true, render: (c) => `#${c.id}` },
        { key: 'customer_name', header: 'Customer', sortable: true, render: (c) => c.customer_name || 'Guest' },
        { key: 'model', header: 'Model', sortable: true },
        { key: 'type', header: 'Type', sortable: true },
        { key: 'design', header: 'Design', sortable: true },
        { key: 'created_at', header: 'Date', sortable: true, render: (c) => new Date(c.created_at).toLocaleDateString() },
        { key: 'status', header: 'Status', sortable: true, render: (c) => <Badge tone={TONE[c.status] || 'neutral'}>{c.status}</Badge> },
    ]

    if (status === 'loading') return <p className="ui-muted">Loading…</p>
    if (status === 'error') return <p style={{ color: 'var(--ui-danger)' }}>Couldn&apos;t load requests.</p>

    return (
        <div>
            <PageHeader title="Custom Requests" subtitle={`${rows.length} total`} />
            <DataTable
                columns={columns}
                rows={rows}
                searchKeys={['customer_name', 'customer_email', 'model', 'type', 'design', 'status']}
                searchPlaceholder="Search requests…"
                rowActions={(c) => <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => setDetail(c)}>View</button>}
            />

            <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail ? `Request #${detail.id}` : ''}>
                {detail ? (
                    <div className="flex flex-col gap-5">
                        <div>
                            <label className="ui-muted text-xs font-semibold uppercase">Status</label>
                            <div className="mt-1">
                                <Select value={detail.status} onChange={(v) => change(detail.id, v)} options={STATUSES} />
                            </div>
                        </div>
                        <Detail label="Customer" value={`${detail.customer_name || 'Guest'}${detail.customer_email ? ` · ${detail.customer_email}` : ''}`} />
                        <Detail label="Model" value={detail.model} />
                        <Detail label="Type" value={detail.type} />
                        <Detail label="Design" value={detail.design} />
                        {detail.sentence ? <Detail label="Sentence" value={detail.sentence} /> : null}
                        {detail.comments ? <Detail label="Comments" value={detail.comments} /> : null}
                        <Detail label="Submitted" value={new Date(detail.created_at).toLocaleString()} />
                    </div>
                ) : null}
            </Drawer>
        </div>
    )
}

function Detail({ label, value }) {
    return (
        <div className="text-sm flex flex-col gap-1">
            <span style={{ color: 'var(--ui-text)' }} className="font-semibold">{label}</span>
            <span className="ui-muted">{value}</span>
        </div>
    )
}

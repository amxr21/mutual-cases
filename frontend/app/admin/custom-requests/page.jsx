'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'

const STATUSES = ['pending', 'in_review', 'approved', 'rejected', 'completed']
const COLOR = {
    pending: 'bg-gold/15 text-gold', in_review: 'bg-blue/15 text-blue',
    approved: 'bg-green-600/15 text-green-700', rejected: 'bg-red-500/15 text-red-600',
    completed: 'bg-blue/15 text-blue',
}

export default function AdminCustomRequests() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')

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
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Custom Requests</h1>
            {status === 'loading' ? <p className="font-light">Loading…</p> : null}
            {status === 'error' ? <p className="text-blue">Couldn&apos;t load requests.</p> : null}
            {status === 'ready' ? (
                <div className="flex flex-col gap-3">
                    {rows.length === 0 ? <p className="font-light">No custom requests yet.</p> : null}
                    {rows.map((c) => (
                        <div key={c.id} className="bg-off-white rounded-xl shadow-sm border border-black/5 p-4 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold">#{c.id} · {c.customer_name || 'Guest'} {c.customer_email ? `(${c.customer_email})` : ''}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${COLOR[c.status] || 'bg-gray-200'}`}>{c.status}</span>
                                    <select value={c.status} onChange={(e) => change(c.id, e.target.value)} className="bg-blue/5 border border-blue/30 text-blue rounded-lg py-1 px-2 text-sm outline-none">
                                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="text-sm font-light grid grid-cols-2 md:grid-cols-4 gap-2">
                                <span><b>Model:</b> {c.model}</span>
                                <span><b>Type:</b> {c.type}</span>
                                <span><b>Design:</b> {c.design}</span>
                                <span><b>Date:</b> {new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            {c.sentence ? <div className="text-sm"><b>Sentence:</b> {c.sentence}</div> : null}
                            {c.comments ? <div className="text-sm"><b>Comments:</b> {c.comments}</div> : null}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

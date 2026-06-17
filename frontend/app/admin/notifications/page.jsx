'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJSON, postJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import RefreshButton from '../ui/RefreshButton'

const TYPE_META = {
    custom: { label: 'Custom request', tone: 'blue', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128z' },
    order: { label: 'Order', tone: 'gold', icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5' },
    return: { label: 'Return', tone: 'red', icon: 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' },
    review: { label: 'Review', tone: 'green', icon: 'M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z' },
}
const fmtDateTime = (d) => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function AdminNotifications() {
    const toast = useToast()
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')

    const load = async () => {
        setStatus('loading')
        const r = await getJSON('/admin/notifications')
        if (r.ok && r.data) { setData(r.data); setStatus('ready') }
        else setStatus('error')
    }
    useEffect(() => { load() }, [])

    const markAllRead = async () => {
        const r = await postJSON('/admin/notifications/seen', {})
        if (!r.ok) { toast.error('Failed to mark read'); return }
        toast.success('All caught up')
        // Update local view + tell the topbar bell to clear.
        setData((d) => d ? { ...d, items: d.items.map((i) => ({ ...i, unread: false })), counts: { custom: 0, order: 0, return: 0, review: 0, total: 0 } } : d)
        try { window.dispatchEvent(new Event('mutual:notifications-seen')) } catch { /* ignore */ }
    }

    if (status === 'loading') return <Loader />
    if (status === 'error') return <AdminMessage variant="error" title="Couldn't load notifications" message="Please refresh to try again." />

    const { items, counts } = data

    return (
        <div>
            <PageHeader
                title="Notifications"
                subtitle={counts.total ? `${counts.total} unread` : 'All caught up'}
                actions={<><RefreshButton onRefresh={load} />{counts.total ? <button className="ui-btn ui-btn-ghost" onClick={markAllRead}>Mark all read</button> : null}</>}
            />

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 mb-5">
                {Object.entries(TYPE_META).map(([k, m]) => (
                    <span key={k} className="ui-surface px-3 py-1.5 text-sm flex items-center gap-2">
                        {m.label}
                        <Badge tone={counts[k] ? m.tone : 'neutral'}>{counts[k] || 0}</Badge>
                    </span>
                ))}
            </div>

            {items.length === 0 ? (
                <AdminMessage variant="empty" title="Nothing pending" message="New custom requests, orders, returns, and reviews will appear here." />
            ) : (
                <div className="ui-surface divide-y ui-border">
                    {items.map((n) => {
                        const m = TYPE_META[n.type] || TYPE_META.order
                        return (
                            <Link key={`${n.type}-${n.id}`} href={n.href} className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--ui-surface-2)]">
                                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--ui-surface-2)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" style={{ color: 'var(--ui-primary)' }} strokeWidth={1.6}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                                    </svg>
                                </span>
                                <div className="grow min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge tone={m.tone}>{m.label}</Badge>
                                        {n.unread ? <span className="w-2 h-2 rounded-full" style={{ background: 'var(--ui-danger)' }} /> : null}
                                    </div>
                                    <p className="text-sm mt-1 truncate" style={{ color: 'var(--ui-text)' }}>{n.title}</p>
                                </div>
                                <span className="ui-muted text-xs whitespace-nowrap">{fmtDateTime(n.created_at)}</span>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

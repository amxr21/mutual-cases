'use client'
import { useEffect, useState } from 'react'
import { getJSON, patchJSON, deleteJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, Badge } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import RefreshButton from '../ui/RefreshButton'
import DataTable from '../ui/DataTable'
import Drawer from '../ui/Drawer'
import ConfirmDialog from '../ui/ConfirmDialog'
import ReportLink from '../ui/ReportLink'

const STATUS_TONE = { pending: 'gold', approved: 'green', rejected: 'red' }
const FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'flagged', label: 'Flagged' },
    { key: 'all', label: 'All' },
]

function Stars({ value }) {
    return (
        <span className="inline-flex" title={`${value} / 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <svg key={n} viewBox="0 0 24 24" className="size-4" style={{ fill: value >= n ? 'var(--ui-accent)' : 'transparent', stroke: value >= n ? 'var(--ui-accent)' : 'var(--ui-border)' }} strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            ))}
        </span>
    )
}

export default function AdminReviews() {
    const toast = useToast()
    const [rows, setRows] = useState([])
    const [counts, setCounts] = useState(null)
    const [status, setStatus] = useState('loading')
    const [filter, setFilter] = useState('pending')
    const [detail, setDetail] = useState(null)
    const [replyDraft, setReplyDraft] = useState('')
    const [busy, setBusy] = useState(false)
    const [confirm, setConfirm] = useState(null) // review pending delete

    const productLabel = (r) => [r.category, r.model, r.edition].filter(Boolean).join(' · ')

    const load = async () => {
        setStatus('loading')
        const qs = filter === 'flagged' ? '?flagged=1' : filter === 'all' ? '' : `?status=${filter}`
        const [list, c] = await Promise.all([
            getJSON(`/admin/reviews${qs}`),
            getJSON('/admin/reviews/counts'),
        ])
        if (list.ok && Array.isArray(list.data)) { setRows(list.data); setStatus('ready') }
        else setStatus('error')
        if (c.ok) setCounts(c.data)
    }
    useEffect(() => { load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

    // Optimistically patch a row in local state, then refresh counts.
    const refreshCounts = async () => {
        const c = await getJSON('/admin/reviews/counts')
        if (c.ok) setCounts(c.data)
    }

    const applyLocal = (id, patch) => {
        setRows((prev) => {
            // If the row no longer matches the active filter, drop it from the view.
            const next = prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
            if (filter === 'all') return next
            return next.filter((x) => {
                if (x.id !== id) return true
                if (filter === 'flagged') return x.flagged
                return x.status === filter
            })
        })
        setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d))
    }

    const setStatusFor = async (id, newStatus) => {
        setBusy(true)
        const r = await patchJSON(`/admin/reviews/${id}/status`, { status: newStatus })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success(`Review ${newStatus}`)
        applyLocal(id, { status: newStatus })
        refreshCounts()
    }

    const toggleFlag = async (id, flagged) => {
        setBusy(true)
        const r = await patchJSON(`/admin/reviews/${id}/flag`, { flagged })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success(flagged ? 'Flagged' : 'Flag cleared')
        applyLocal(id, { flagged })
        refreshCounts()
    }

    const saveReply = async () => {
        if (!detail) return
        setBusy(true)
        const r = await patchJSON(`/admin/reviews/${detail.id}/reply`, { admin_reply: replyDraft })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success(replyDraft.trim() ? 'Reply saved' : 'Reply removed')
        setRows((prev) => prev.map((x) => x.id === detail.id ? { ...x, admin_reply: replyDraft.trim() || null } : x))
        setDetail((d) => d ? { ...d, admin_reply: replyDraft.trim() || null } : d)
    }

    const doDelete = async () => {
        if (!confirm) return
        setBusy(true)
        const r = await deleteJSON(`/admin/reviews/${confirm.id}`)
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || 'Delete failed'); return }
        toast.success('Review deleted')
        setRows((prev) => prev.filter((x) => x.id !== confirm.id))
        if (detail?.id === confirm.id) setDetail(null)
        setConfirm(null)
        refreshCounts()
    }

    const openDetail = (r) => { setDetail(r); setReplyDraft(r.admin_reply || '') }

    const columns = [
        { key: 'product', header: 'Product', render: (r) => <span className="capitalize">{productLabel(r)}</span> },
        { key: 'author', header: 'Author', sortable: true, render: (r) => (
            <span className="inline-flex items-center gap-2">
                {r.author}
                {r.verified ? <Badge tone="green">Verified</Badge> : null}
            </span>
        ) },
        { key: 'rating', header: 'Rating', sortable: true, render: (r) => <Stars value={r.rating} /> },
        { key: 'comment', header: 'Comment', render: (r) => (
            <span className="ui-muted">{r.comment ? (r.comment.length > 60 ? r.comment.slice(0, 60) + '…' : r.comment) : '—'}</span>
        ) },
        { key: 'status', header: 'Status', sortable: true, render: (r) => (
            <span className="inline-flex items-center gap-1.5">
                <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge>
                {r.flagged ? <Badge tone="red">Flagged</Badge> : null}
            </span>
        ) },
        { key: 'created_at', header: 'Date', sortable: true, render: (r) => new Date(r.created_at).toLocaleDateString() },
    ]

    return (
        <div>
            <PageHeader title="Reviews" subtitle="Moderate customer reviews before they appear on the storefront" actions={<><RefreshButton onRefresh={load} /><ReportLink report="reviews-detail" /></>} />

            {/* Filter tabs with live counts */}
            <div className="flex flex-wrap gap-2 mb-4">
                {FILTERS.map((f) => {
                    const n = counts ? counts[f.key === 'all' ? 'total' : f.key] : null
                    const active = filter === f.key
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className="ui-btn"
                            style={{
                                background: active ? 'var(--ui-primary)' : 'transparent',
                                color: active ? 'var(--ui-primary-contrast)' : 'var(--ui-text)',
                                border: active ? 'none' : '1px solid var(--ui-border)',
                            }}
                        >
                            {f.label}{n != null ? <span className="opacity-70">· {n}</span> : null}
                        </button>
                    )
                })}
            </div>

            {status === 'loading' ? <Loader rows={6} /> : null}
            {status === 'error' ? <AdminMessage variant="error" title="Couldn't load reviews" message="Please refresh to try again." /> : null}
            {status === 'ready' ? (
                <DataTable
                    columns={columns}
                    rows={rows}
                    searchKeys={['author', 'author_email', 'comment', 'model', 'edition', 'category']}
                    searchPlaceholder="Search reviews…"
                    emptyText="No reviews in this view."
                    rowActions={(r) => (
                        <div className="flex gap-2 justify-end">
                            <button className="ui-btn ui-btn-ghost !py-1 !px-3" onClick={() => openDetail(r)}>View</button>
                            {r.status !== 'approved' ? (
                                <button className="ui-btn ui-btn-ghost !py-1 !px-3" disabled={busy} onClick={() => setStatusFor(r.id, 'approved')} style={{ color: 'var(--ui-success)' }}>Approve</button>
                            ) : null}
                            {r.status !== 'rejected' ? (
                                <button className="ui-btn ui-btn-danger !py-1 !px-3" disabled={busy} onClick={() => setStatusFor(r.id, 'rejected')}>Reject</button>
                            ) : null}
                        </div>
                    )}
                />
            ) : null}

            <Drawer
                open={!!detail}
                onClose={() => setDetail(null)}
                title={detail ? `Review #${detail.id}` : ''}
                footer={detail ? (
                    <>
                        <button className="ui-btn ui-btn-danger" disabled={busy} onClick={() => setConfirm(detail)}>Delete</button>
                        <button className="ui-btn ui-btn-ghost" disabled={busy} onClick={() => toggleFlag(detail.id, !detail.flagged)}>
                            {detail.flagged ? 'Clear flag' : 'Flag'}
                        </button>
                        {detail.status !== 'approved' ? (
                            <button className="ui-btn ui-btn-primary" disabled={busy} onClick={() => setStatusFor(detail.id, 'approved')}>Approve</button>
                        ) : (
                            <button className="ui-btn ui-btn-ghost" disabled={busy} onClick={() => setStatusFor(detail.id, 'rejected')}>Reject</button>
                        )}
                    </>
                ) : null}
            >
                {detail ? (
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <Stars value={detail.rating} />
                            <span className="inline-flex items-center gap-1.5">
                                <Badge tone={STATUS_TONE[detail.status] || 'neutral'}>{detail.status}</Badge>
                                {detail.verified ? <Badge tone="green">Verified purchase</Badge> : null}
                                {detail.flagged ? <Badge tone="red">Flagged</Badge> : null}
                            </span>
                        </div>
                        <Detail label="Product" value={<span className="capitalize">{productLabel(detail)}</span>} />
                        <Detail label="Author" value={`${detail.author}${detail.author_email ? ` · ${detail.author_email}` : ''}`} />
                        <Detail label="Comment" value={detail.comment || <span className="ui-muted">No comment</span>} />
                        <Detail label="Submitted" value={new Date(detail.created_at).toLocaleString()} />

                        <div className="flex flex-col gap-1.5 text-sm">
                            <span style={{ color: 'var(--ui-text)' }} className="font-semibold">Store reply (public)</span>
                            <textarea
                                value={replyDraft}
                                onChange={(e) => setReplyDraft(e.target.value)}
                                className="ui-textarea"
                                rows={3}
                                maxLength={1000}
                                placeholder="Reply publicly to this review…"
                            />
                            <div className="flex justify-end">
                                <button className="ui-btn ui-btn-ghost !py-1 !px-3" disabled={busy} onClick={saveReply}>
                                    {detail.admin_reply ? 'Update reply' : 'Save reply'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Drawer>

            <ConfirmDialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                onConfirm={doDelete}
                busy={busy}
                title="Delete review?"
                message={confirm ? `This permanently removes ${confirm.author}'s review. This can't be undone.` : ''}
                confirmLabel="Delete"
            />
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

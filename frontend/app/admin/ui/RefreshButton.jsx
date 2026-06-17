'use client'
import { useState } from 'react'

/**
 * Refresh control for admin table/list pages. Drop into a page's PageHeader
 * actions and pass the page's existing `load` function:
 *
 *   <PageHeader ... actions={<RefreshButton onRefresh={load} />} />
 *
 * Manages its own spinning state so the rest of the page doesn't blank out —
 * the existing data stays on screen while the re-fetch runs.
 */
export default function RefreshButton({ onRefresh, label = 'Refresh' }) {
    const [busy, setBusy] = useState(false)

    const handle = async () => {
        if (busy || typeof onRefresh !== 'function') return
        setBusy(true)
        try { await onRefresh() } finally { setBusy(false) }
    }

    return (
        <button
            type="button"
            onClick={handle}
            disabled={busy}
            className="ui-btn ui-btn-ghost flex items-center gap-1.5"
            title="Refresh"
        >
            <span className={busy ? 'inline-block animate-spin' : 'inline-block'} aria-hidden>↻</span>
            {busy ? 'Refreshing…' : label}
        </button>
    )
}

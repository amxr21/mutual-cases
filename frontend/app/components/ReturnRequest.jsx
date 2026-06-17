'use client'
import { useState } from 'react'
import { postJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'

/**
 * Customer-facing "request a return" control for a delivered order. Lets the
 * customer pick which items + quantities to return and a reason, then submits
 * to /returns (the server re-validates against the real order). Collapsed by
 * default to keep the order card clean.
 */
export default function ReturnRequest({ order }) {
    const toast = useToast()
    const [open, setOpen] = useState(false)
    const [done, setDone] = useState(false)
    const [busy, setBusy] = useState(false)
    const [reason, setReason] = useState('')
    // qty selected per product_id (0 = not returning)
    const [qty, setQty] = useState({})

    const setItemQty = (pid, max, v) => {
        const n = Math.max(0, Math.min(Number(v) || 0, max))
        setQty((q) => ({ ...q, [pid]: n }))
    }

    const submit = async () => {
        const items = (order.items || [])
            .map((it) => ({ product_id: it.product_id, quantity: qty[it.product_id] || 0 }))
            .filter((it) => it.quantity > 0)
        if (!items.length) { toast.error('Select at least one item and quantity'); return }
        setBusy(true)
        const r = await postJSON('/returns', { order_number: order.order_number, reason, items })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || "Couldn't submit your return"); return }
        setDone(true)
        toast.success('Return requested — we\'ll review it shortly')
    }

    if (done) {
        return <p className="text-sm text-green-700 bg-green-600/10 rounded-md px-3 py-2 self-start">Return requested — we&apos;ll email you once it&apos;s reviewed.</p>
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="text-sm text-blue underline self-start">
                Request a return
            </button>
        )
    }

    return (
        <div className="rounded-lg border border-blue/15 bg-blue/5 p-3 flex flex-col gap-3">
            <span className="font-semibold text-sm">Request a return</span>
            <div className="flex flex-col gap-2">
                {order.items?.map((it) => (
                    <div key={it.product_id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="capitalize font-light">{it.category} {it.model} <span className="opacity-60">(max {it.quantity})</span></span>
                        <input
                            type="number" min={0} max={it.quantity}
                            value={qty[it.product_id] ?? 0}
                            onChange={(e) => setItemQty(it.product_id, it.quantity, e.target.value)}
                            className="w-16 border border-gray-300 rounded-md py-1 px-2 outline-none focus:border-blue text-center"
                        />
                    </div>
                ))}
            </div>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="w-full border border-gray-300 rounded-md py-2 px-3 outline-none focus:border-blue text-sm" />
            <div className="flex gap-2 justify-end">
                <button onClick={() => setOpen(false)} className="text-sm text-off-black/50 px-3 py-1.5">Cancel</button>
                <button onClick={submit} disabled={busy} className="bg-blue text-off-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-60">{busy ? 'Submitting…' : 'Submit return'}</button>
            </div>
        </div>
    )
}

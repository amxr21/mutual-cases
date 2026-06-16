'use client'
import { useState } from 'react'
import { postJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'

/**
 * Inline review form for a purchased product (used on My Orders). Star rating +
 * optional comment, submits to /reviews (server enforces purchase-gating).
 * Prefills from an existing review if the user already reviewed this product.
 */
function Stars({ value, onChange }) {
    const [hover, setHover] = useState(0)
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    className="transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                >
                    <svg viewBox="0 0 24 24" className={`size-6 ${(hover || value) >= n ? 'fill-gold stroke-gold' : 'fill-none stroke-gray-400'}`} strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                </button>
            ))}
        </div>
    )
}

export default function ReviewForm({ productId, existing, onSubmitted }) {
    const toast = useToast()
    const [open, setOpen] = useState(false)
    const [rating, setRating] = useState(existing?.rating || 0)
    const [comment, setComment] = useState(existing?.comment || '')
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (rating < 1) { toast.error('Please pick a star rating'); return }
        setBusy(true)
        const r = await postJSON('/reviews', { product_id: productId, rating, comment })
        setBusy(false)
        if (!r.ok) { toast.error(r.error?.message || "Couldn't submit your review"); return }
        toast.success(existing ? 'Review updated' : 'Thanks for your review!')
        setOpen(false)
        onSubmitted?.({ product_id: productId, rating, comment })
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-sm text-blue underline font-medium"
            >
                {existing ? 'Edit your review' : 'Write a review'}
            </button>
        )
    }

    return (
        <div className="flex flex-col gap-2 bg-blue/[0.03] border border-blue/15 rounded-lg p-3 mt-1">
            <Stars value={rating} onChange={setRating} />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Share your thoughts (optional)…"
                className="w-full bg-off-white border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:border-blue transition-colors resize-none"
            />
            <div className="flex gap-2">
                <button type="button" onClick={submit} disabled={busy} className="bg-blue text-off-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:brightness-110 transition disabled:opacity-60">
                    {busy ? 'Saving…' : 'Submit'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm px-4 py-1.5 rounded-lg border border-gray-300 hover:bg-black/5 transition">
                    Cancel
                </button>
            </div>
        </div>
    )
}

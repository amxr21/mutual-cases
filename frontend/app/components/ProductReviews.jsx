'use client'
import { useEffect, useState } from 'react'
import { getJSON } from '../lib/safeFetch'

/**
 * Product reviews block for the detail page: average rating + star summary and
 * the list of individual reviews. Reads from /reviews/product/:id.
 */
function StarRow({ value, size = 'size-4' }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <svg key={n} viewBox="0 0 24 24" className={`${size} ${value >= n ? 'fill-gold stroke-gold' : value >= n - 0.5 ? 'fill-gold/50 stroke-gold' : 'fill-none stroke-gray-300'}`} strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            ))}
        </div>
    )
}

export default function ProductReviews({ productId }) {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        if (!productId) return
        let active = true
        ;(async () => {
            const r = await getJSON(`/reviews/product/${productId}`)
            if (!active) return
            if (r.ok && r.data) { setData(r.data); setStatus('ready') }
            else setStatus('error')
        })()
        return () => { active = false }
    }, [productId])

    if (status === 'loading' || status === 'error') return null

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <h3 className="text-xl xl:text-2xl font-semibold">Reviews</h3>
                <span className="h-px grow bg-gradient-to-r from-blue/30 to-transparent" />
            </div>

            {data.count === 0 ? (
                <p className="font-light text-off-black/60">No reviews yet — be the first to review this product after purchase.</p>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-bold text-blue">{data.average}</span>
                        <div className="flex flex-col gap-1">
                            <StarRow value={data.average} size="size-5" />
                            <span className="text-sm font-light text-off-black/60">{data.count} review{data.count == 1 ? '' : 's'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {data.reviews.map((r) => (
                            <div key={r.id} className="border-t border-black/5 pt-4 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold">{r.author}</span>
                                        {r.verified ? (
                                            <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-green-700 bg-green-600/10 rounded-full px-2 py-0.5">
                                                <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                Verified purchase
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="text-xs font-light text-off-black/50">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <StarRow value={r.rating} />
                                {r.comment ? <p className="font-light text-off-black/80">{r.comment}</p> : null}
                                {r.admin_reply ? (
                                    <div className="mt-1.5 ml-3 pl-3 border-l-2 border-blue/30 flex flex-col gap-0.5">
                                        <span className="text-xs font-semibold text-blue">Mutual replied</span>
                                        <p className="font-light text-sm text-off-black/70">{r.admin_reply}</p>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

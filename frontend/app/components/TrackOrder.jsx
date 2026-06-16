'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrderView } from '.'

/**
 * Track Order (Task 6 + 2-column refinement).
 *
 * Desktop: a 2-column layout (like checkout) — left holds the lookup form +
 * order info/address, right holds the order-journey stepper. Mobile stacks.
 * Pre-fills from ?order= so success page / journey links deep-link in.
 */
export default function TrackOrder() {
    const params = useSearchParams()
    const initial = params.get('order') || ''
    const [input, setInput] = useState(initial)
    const [tracking, setTracking] = useState(initial)
    // Deep-linked from a success/journey link: the order number is fixed, so we
    // don't show the "change order number" form inside the tracking view.
    const deepLinked = !!initial

    useEffect(() => {
        setInput(initial)
        setTracking(initial)
    }, [initial])

    const submit = (e) => {
        e.preventDefault()
        setTracking(input.trim())
    }

    const trackForm = (
        <form onSubmit={submit} className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Find your order</h3>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Order number (e.g. MTL-XXXX-1234)"
                    className="grow bg-off-white border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-blue transition-colors"
                />
                <button
                    type="submit"
                    className="bg-blue text-off-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 hover:brightness-110 active:scale-[0.99]"
                >
                    Track
                </button>
            </div>
        </form>
    )

    if (!tracking) {
        // No number yet — just show the form, centered, no stepper.
        return <div className="max-w-2xl">{trackForm}</div>
    }

    return (
        <div key={tracking} className="reveal">
            {/* When deep-linked, the order number is fixed — hide the lookup form
                so the user can't change it from inside the tracking view. When
                the user searched manually, keep the form so they can look up another. */}
            <OrderView orderNumber={tracking} showTrackLink={false} layout="split" leftExtra={deepLinked ? null : trackForm} />
        </div>
    )
}

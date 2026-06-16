'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJSON } from '../lib/safeFetch'
import { OrderStepper } from '.'

/**
 * Fetches and displays a single order by number: status stepper, line items,
 * address, gift/note, and total. Used by both Order Success and Track Order.
 * `successMode` shows the celebratory confirmation header.
 */

// Map order status_id -> stepper index.
const STATUS_TO_STEP = { 1: 0, 2: 1, 3: 3, 4: 4 } // Pending,Confirmed,Shipped,Delivered

const STEPS = [
    { label: 'Order Placed', desc: 'We received your order.' },
    { label: 'Confirmed', desc: 'Payment confirmed.' },
    { label: 'In Production', desc: 'Being packed in the UAE.' },
    { label: 'Shipped', desc: 'On its way to you.' },
    { label: 'Delivered', desc: 'Enjoy!' },
]

export default function OrderView({ orderNumber, successMode = false, showTrackLink = true, layout = 'stack', leftExtra = null }) {
    const [order, setOrder] = useState(null)
    const [status, setStatus] = useState('loading') // loading | ready | notfound | error

    useEffect(() => {
        if (!orderNumber) {
            setStatus('notfound')
            return
        }
        let active = true
        ;(async () => {
            const result = await getJSON(`/orders/${encodeURIComponent(orderNumber)}`)
            if (!active) return
            if (result.ok && result.data?.order_number) {
                setOrder(result.data)
                setStatus('ready')
            } else if (result.status === 404) {
                setStatus('notfound')
            } else {
                setStatus('error')
            }
        })()
        return () => {
            active = false
        }
    }, [orderNumber])

    if (status === 'loading') return <p className="font-light py-8">Loading order…</p>
    if (status === 'notfound')
        return (
            <div className="py-8 flex flex-col gap-3">
                <p className="font-light text-blue text-lg">We couldn&apos;t find that order.</p>
                <Link href="/track-order" className="underline text-blue">Try another order number</Link>
            </div>
        )
    if (status === 'error') return <p className="font-light text-blue py-8">Something went wrong loading the order.</p>

    const currentStep = STATUS_TO_STEP[order.status_id] ?? 0

    const successHeader = successMode ? (
        <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-full bg-blue text-off-white flex items-center justify-center reveal">
                <svg viewBox="0 0 24 24" fill="none" className="size-8 stroke-current" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
            <h2 className="text-2xl xl:text-3xl font-semibold">Thank you for your order!</h2>
            <p className="font-light">A confirmation has been created for your records.</p>
        </div>
    ) : null

    const headerCard = (
        <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-light">Order Number</span>
                <span className="font-semibold text-lg">{order.order_number}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="font-light">Status</span>
                <span className="px-3 py-1 rounded-full bg-blue text-off-white text-sm font-medium">{order.status}</span>
            </div>
        </div>
    )

    const stepperCard = (
        <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 h-fit">
            <h3 className="text-lg font-semibold mb-6">Order Journey</h3>
            <OrderStepper steps={STEPS} currentStep={currentStep} />
        </div>
    )

    // Delivery info — shown (below the journey) once a driver is assigned or
    // tracking is set in admin. Hidden entirely until then.
    const hasDelivery = order.driver_name || order.tracking_number || order.carrier || order.eta
    const deliveryCard = hasDelivery ? (
        <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
                <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-blue" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <h3 className="text-lg font-semibold">Your delivery</h3>
            </div>
            {order.driver_name ? (
                <DeliveryRow label="Driver" value={`${order.driver_name}${order.driver_phone ? ` · ${order.driver_phone}` : ''}`} />
            ) : null}
            {order.carrier ? <DeliveryRow label="Carrier" value={order.carrier} /> : null}
            {order.tracking_number ? <DeliveryRow label="Tracking #" value={order.tracking_number} /> : null}
            {order.eta ? <DeliveryRow label="Estimated delivery" value={new Date(order.eta).toLocaleDateString()} /> : null}
        </div>
    ) : null

    const detailsCard = (
        <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Items</h3>
            <div className="flex flex-col gap-3">
                {order.items?.map((it) => (
                    <div key={it.product_id} className="flex justify-between gap-3">
                        <span className="font-light capitalize">
                            {it.category} {it.model} <span className="opacity-60">×{it.quantity}</span>
                        </span>
                        <span className="font-semibold whitespace-nowrap">{Number(it.price) * Number(it.quantity)} AED</span>
                    </div>
                ))}
            </div>

            {order.gift ? <div className="text-sm bg-blue/5 rounded-md px-3 py-2">🎁 Gift wrapping</div> : null}
            {order.note ? <div className="text-sm bg-blue/5 rounded-md px-3 py-2">📝 {order.note}</div> : null}

            {order.address ? (
                <div className="text-sm font-light text-off-black/70">
                    Ship to: {[order.address.address, order.address.area, order.address.city, order.address.country].filter(Boolean).join(', ')}
                </div>
            ) : null}

            <div className="flex justify-between text-xl font-semibold border-t pt-3">
                <span>Total</span>
                <span>{order.total} AED</span>
            </div>
        </div>
    )

    const actions = (
        <div className="flex flex-col xl:flex-row gap-3">
            <Link href="/products" className="bg-blue text-off-white font-semibold px-6 py-3 rounded-lg text-center transition-all hover:brightness-110">
                Continue shopping
            </Link>
            {showTrackLink ? (
                <Link href={`/track-order?order=${encodeURIComponent(order.order_number)}`} className="border border-blue text-blue font-semibold px-6 py-3 rounded-lg text-center transition-all hover:bg-blue/5">
                    Track this order
                </Link>
            ) : null}
        </div>
    )

    // Split layout (Track page on desktop): details/info on the left, the order
    // journey stepper on the right. Stacks to one column on mobile.
    if (layout === 'split') {
        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 items-start">
                <div className="flex flex-col gap-6">
                    {leftExtra}
                    {headerCard}
                    {detailsCard}
                    {actions}
                </div>
                <div className="xl:sticky xl:top-6 flex flex-col gap-6">
                    {stepperCard}
                    {deliveryCard}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            {successHeader}
            {headerCard}
            {stepperCard}
            {deliveryCard}
            {detailsCard}
            {actions}
        </div>
    )
}

function DeliveryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-3 text-sm">
            <span className="font-light text-off-black/70">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    )
}

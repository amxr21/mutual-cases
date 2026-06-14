'use client'
import { InfoPage, OrderStepper } from "@/app/components"

const STEPS = [
    { label: "Order Placed", desc: "Browse or design, add to cart, and check out securely." },
    { label: "Confirmed", desc: "We confirm your order and lock in the details." },
    { label: "In Production", desc: "Your cover is picked, checked, and carefully packed in the UAE." },
    { label: "Shipped", desc: "Fast local delivery — you'll get updates along the way." },
    { label: "Delivered", desc: "Unbox and enjoy. Tag us — we'd love to see it!" },
]

export default function OrderJourney() {
    return (
        <InfoPage title="ORDER JOURNEY" subtitle="From cart to doorstep.">
            <p className="text-center xl:text-left">
                Here&apos;s the journey every Mutual order takes. Track your own order any time from the
                Track Order page.
            </p>

            <div className="py-8">
                <OrderStepper steps={STEPS} autoPlay />
            </div>

            <a
                href="/track-order"
                className="self-center xl:self-start inline-block bg-blue text-off-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:brightness-110 active:scale-[0.99]"
            >
                Track your order
            </a>
        </InfoPage>
    )
}

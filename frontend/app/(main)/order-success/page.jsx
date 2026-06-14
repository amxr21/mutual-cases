'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrderView } from '@/app/components'

function SuccessInner() {
    const params = useSearchParams()
    const orderNumber = params.get('order')
    return <OrderView orderNumber={orderNumber} successMode />
}

export default function OrderSuccessPage() {
    return (
        <main className="flex flex-col gap-6 py-6 max-w-3xl mx-auto w-full">
            <Suspense fallback={<p className="font-light py-8">Loading order…</p>}>
                <SuccessInner />
            </Suspense>
        </main>
    )
}

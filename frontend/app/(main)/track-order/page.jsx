'use client'
import { Suspense } from 'react'
import { TrackOrder } from '@/app/components'

export default function TrackOrderPage() {
    return (
        <main className="flex flex-col gap-6 py-6 w-full">
            <div className="border-b border-gray-500 pb-2">
                <h1 className="text-3xl xl:text-4xl font-semibold">Track Your Order</h1>
            </div>
            <Suspense fallback={<p className="font-light py-8">Loading…</p>}>
                <TrackOrder />
            </Suspense>
        </main>
    )
}

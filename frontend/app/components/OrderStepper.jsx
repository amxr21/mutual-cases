'use client'
import { useEffect, useState } from 'react'

/**
 * Animated multi-step order journey graph (Task 5), reused by Track Order
 * (Task 6). Shows completed / current / upcoming steps with a progress line that
 * fills smoothly and check/pulse animations.
 *
 * @param {{label:string, desc?:string}[]} steps
 * @param {number} currentStep  index of the active step (0-based)
 * @param {boolean} [autoPlay]  on the journey page, animate through the steps
 */
const DEFAULT_STEPS = [
    { label: 'Order Placed', desc: 'We received your order and sent a confirmation.' },
    { label: 'Confirmed', desc: 'Payment confirmed and your order is locked in.' },
    { label: 'In Production', desc: 'Your cover is being picked, checked, and packed.' },
    { label: 'Shipped', desc: 'On its way with fast local UAE delivery.' },
    { label: 'Delivered', desc: 'Enjoy your Mutual cover!' },
]

export default function OrderStepper({ steps = DEFAULT_STEPS, currentStep = 0, autoPlay = false }) {
    const [active, setActive] = useState(autoPlay ? 0 : currentStep)

    // On the journey page, walk through the steps to showcase the flow.
    useEffect(() => {
        if (!autoPlay) {
            setActive(currentStep)
            return
        }
        let i = 0
        setActive(0)
        const t = setInterval(() => {
            i += 1
            if (i >= steps.length) {
                i = 0 // loop the showcase
            }
            setActive(i)
        }, 1600)
        return () => clearInterval(t)
    }, [autoPlay, currentStep, steps.length])

    const progressPct = steps.length > 1 ? (active / (steps.length - 1)) * 100 : 0

    return (
        <div className="w-full">
            {/* Horizontal (desktop) */}
            <div className="hidden md:block relative">
                {/* track */}
                <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded-full" />
                {/* fill */}
                <div
                    className="absolute left-0 top-5 h-1 bg-blue rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPct}%` }}
                />
                <div className="relative flex justify-between">
                    {steps.map((step, i) => {
                        const done = i < active
                        const current = i === active
                        return (
                            <div key={step.label} className="flex flex-col items-center gap-2 w-full">
                                <div
                                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                        ${done ? 'bg-blue border-blue text-off-white' : ''}
                                        ${current ? 'bg-off-white border-blue text-blue scale-110 shadow-lg' : ''}
                                        ${!done && !current ? 'bg-off-white border-gray-300 text-gray-400' : ''}`}
                                >
                                    {current ? (
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-blue/20 animate-ping" />
                                    ) : null}
                                    {done ? (
                                        <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <span className="font-semibold">{i + 1}</span>
                                    )}
                                </div>
                                <div className="text-center px-1">
                                    <p className={`font-semibold text-sm transition-colors duration-300 ${done || current ? 'text-off-black' : 'text-gray-400'}`}>
                                        {step.label}
                                    </p>
                                    {step.desc ? (
                                        <p className={`text-xs font-light mt-1 transition-opacity duration-300 ${current ? 'opacity-100' : 'opacity-60'}`}>
                                            {step.desc}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Vertical (mobile) */}
            <div className="md:hidden flex flex-col">
                {steps.map((step, i) => {
                    const done = i < active
                    const current = i === active
                    const last = i === steps.length - 1
                    return (
                        <div key={step.label} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                        ${done ? 'bg-blue border-blue text-off-white' : ''}
                                        ${current ? 'bg-off-white border-blue text-blue scale-110' : ''}
                                        ${!done && !current ? 'bg-off-white border-gray-300 text-gray-400' : ''}`}
                                >
                                    {current ? <span className="absolute inline-flex h-full w-full rounded-full bg-blue/20 animate-ping" /> : null}
                                    {done ? (
                                        <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <span className="text-sm font-semibold">{i + 1}</span>
                                    )}
                                </div>
                                {!last ? (
                                    <div className={`w-0.5 grow my-1 transition-colors duration-500 ${done ? 'bg-blue' : 'bg-gray-200'}`} style={{ minHeight: '2rem' }} />
                                ) : null}
                            </div>
                            <div className="pb-6">
                                <p className={`font-semibold ${done || current ? 'text-off-black' : 'text-gray-400'}`}>{step.label}</p>
                                {step.desc ? <p className="text-sm font-light opacity-70 mt-0.5">{step.desc}</p> : null}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export { DEFAULT_STEPS }

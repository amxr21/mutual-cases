'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getJSON, postJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'
import SmoothSelect from './SmoothSelect'

import BagImg from '../../public/images/custom-it/bag.jpg'
import DesignerImg from '../../public/images/custom-it/designer.jpg'

/**
 * Custom-it form (per the design): Model / Sentence / Type / Design / Comments
 * with the two brand illustrations and a full-width Submit Order button.
 *
 * Uses native <select> elements (styled to match the design) rather than
 * PrimeReact dropdowns — the app has no PrimeReact theme CSS loaded, which left
 * those dropdowns unstyled/broken. Options come from /products/filters so
 * Model/Type/Design reflect real catalogue values. Submits to /custom.
 */

const cap = (s) => String(s ?? '').replace(/\b\w/g, (c) => c.toUpperCase())

const dedupe = (arr) => {
    const seen = new Set()
    const out = []
    for (const row of arr || []) {
        const key = String(row.value).toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(String(row.value))
    }
    return out
}

// Fallbacks so the form is usable even if the filters request fails.
const FALLBACK = {
    models: ['13', '13 pro', '14', '15 pro', '16 pro'],
    types: ['normal', '3d design', 'simple', 'light', 'magnet'],
    editions: ['abu dhabi edition', 'dubai edition', 'sharjah edition'],
}

export default function CustomItForm() {
    const toast = useToast()

    const [opts, setOpts] = useState(FALLBACK)
    const [form, setForm] = useState({ model: '', sentence: '', type: '', design: '', comments: '' })
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        let active = true
        ;(async () => {
            const result = await getJSON('/products/filters')
            if (!active || !result.ok || !result.data) return
            setOpts({
                models: dedupe(result.data.models).length ? dedupe(result.data.models) : FALLBACK.models,
                types: dedupe(result.data.types).length ? dedupe(result.data.types) : FALLBACK.types,
                editions: dedupe(result.data.editions).length ? dedupe(result.data.editions) : FALLBACK.editions,
            })
        })()
        return () => {
            active = false
        }
    }, [])

    const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
    const setVal = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return

        if (!form.model || !form.type || !form.design) {
            toast.error('Please choose a model, type, and design')
            return
        }

        setSubmitting(true)
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

        const payload = {
            model: form.model,
            sentence: form.sentence,
            type: form.type,
            design: form.design,
            comments: form.comments,
        }
        if (userId) payload.user_id = userId

        const result = await postJSON('/custom', payload)
        setSubmitting(false)

        if (!result.ok) {
            toast.error(result.error?.message || "Couldn't submit your request. Please try again.")
            return
        }

        setForm({ model: '', sentence: '', type: '', design: '', comments: '' })
        setSuccess(true)
    }

    const fieldBase =
        'w-full bg-off-white border border-gray-300 text-off-black rounded-md py-2.5 px-3 outline-none focus:border-blue transition-colors'

    // Animated, on-brand select (SmoothSelect) — passes the chosen value directly.
    const Select = ({ label, value, onValue, options, placeholder }) => (
        <label className="flex flex-col gap-1.5">
            <span className="text-off-black font-medium">{label}</span>
            <SmoothSelect value={value} onChange={onValue} options={options} placeholder={placeholder} />
        </label>
    )

    return (
        <>
        {/* Success modal */}
        <div className={`fixed inset-0 z-[1000001] flex items-center justify-center p-4 transition-all duration-300 ${success ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-off-black/40 backdrop-blur-sm" onClick={() => setSuccess(false)} />
            <div className={`relative bg-off-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center gap-4 transition-all duration-300 ${success ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}>
                <div className="w-16 h-16 rounded-full bg-blue text-off-white flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="size-9 stroke-current" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-blue">Request submitted!</h2>
                <p className="font-light text-off-black/70">
                    Thanks for designing with Mutual. Our team will review your custom request and reach out with the next steps.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                    <button onClick={() => setSuccess(false)} className="grow bg-blue text-off-white font-semibold py-2.5 rounded-lg transition-all hover:brightness-110">Design another</button>
                    <a href="/products" className="grow border border-blue text-blue font-semibold py-2.5 rounded-lg transition-all hover:bg-blue/5 text-center">Browse products</a>
                </div>
            </div>
        </div>

        <form
            onSubmit={handleSubmit}
            className="bg-off-white rounded-2xl shadow-xl p-5 xl:p-8 flex flex-col gap-6 -mt-14 xl:-mt-20 relative z-10 mx-auto max-w-6xl"
        >
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6 xl:gap-8">
                {/* Left: form fields */}
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Model"
                            value={form.model}
                            onValue={setVal('model')}
                            options={opts.models}
                            placeholder="Model"
                        />

                        <label className="flex flex-col gap-1.5">
                            <span className="text-off-black font-medium">Sentence</span>
                            <input
                                type="text"
                                value={form.sentence}
                                onChange={setField('sentence')}
                                placeholder="unleash your creativity…"
                                maxLength={255}
                                className={fieldBase}
                            />
                        </label>

                        <Select
                            label="Type"
                            value={form.type}
                            onValue={setVal('type')}
                            options={opts.types}
                            placeholder="Choose your type"
                        />

                        <Select
                            label="Design"
                            value={form.design}
                            onValue={setVal('design')}
                            options={opts.editions}
                            placeholder="Choose Style"
                        />
                    </div>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-off-black font-medium">Any Special Comments?</span>
                        <textarea
                            value={form.comments}
                            onChange={setField('comments')}
                            rows={4}
                            maxLength={1000}
                            placeholder="…"
                            className={`${fieldBase} resize-none`}
                        />
                    </label>
                </div>

                {/* Right: illustrations */}
                <div className="flex gap-3 h-full min-h-[16rem]">
                    <div className="relative grow h-64 xl:h-full rounded-xl overflow-hidden">
                        <Image src={BagImg} alt="Mutual gift bag" fill className="object-cover" />
                    </div>
                    <div className="relative hidden md:block w-32 xl:w-40 h-64 xl:h-full rounded-xl overflow-hidden">
                        <Image src={DesignerImg} alt="Designing a custom cover" fill className="object-cover" />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue text-off-white text-xl xl:text-2xl font-semibold py-3.5 rounded-lg transition-all duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
                {submitting ? 'Submitting…' : 'Submit Order'}
            </button>
        </form>
        </>
    )
}

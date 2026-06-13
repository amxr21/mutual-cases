'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import { getJSON, postJSON } from '../lib/safeFetch'
import { useToast } from './Toast/ToastProvider'

import BagImg from '../../public/images/custom-it/bag.jpg'
import DesignerImg from '../../public/images/custom-it/designer.jpg'

/**
 * Custom-it form (per the design): Model / Sentence / Type / Design / Comments
 * with the two brand illustrations and a full-width Submit Order button.
 *
 * Dropdown options are pulled from /products/filters so Model/Type/Design always
 * reflect real catalogue values. Submits to /custom; feedback via themed toasts.
 */

const cap = (s) => String(s ?? '').replace(/\b\w/g, (c) => c.toUpperCase())
const toOptions = (rows) =>
    (rows || []).map((r) => ({ label: cap(r.value), value: String(r.value) }))

export default function CustomItForm() {
    const toast = useToast()

    const [opts, setOpts] = useState({ models: [], types: [], editions: [] })
    const [form, setForm] = useState({ model: null, sentence: '', type: null, design: null, comments: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        let active = true
        ;(async () => {
            const result = await getJSON('/products/filters')
            if (!active || !result.ok || !result.data) return
            const dedupe = (arr) => {
                const seen = new Set()
                const out = []
                for (const row of arr || []) {
                    const key = String(row.value).toLowerCase()
                    if (seen.has(key)) continue
                    seen.add(key)
                    out.push(row)
                }
                return out
            }
            setOpts({
                models: toOptions(dedupe(result.data.models)),
                types: toOptions(dedupe(result.data.types)),
                editions: toOptions(dedupe(result.data.editions)),
            })
        })()
        return () => {
            active = false
        }
    }, [])

    const setField = (key) => (eOrValue) => {
        const value = eOrValue?.target ? eOrValue.target.value : eOrValue?.value ?? eOrValue
        setForm((prev) => ({ ...prev, [key]: value }))
    }

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

        toast.success('Your custom request has been submitted!')
        setForm({ model: null, sentence: '', type: null, design: null, comments: '' })
    }

    const dropdownClass =
        'w-full bg-off-white border border-gray-300 text-off-black py-1.5 px-3 rounded-md flex items-center'
    const panelClass = 'px-2 py-1 bg-off-white text-off-black mt-1 border border-gray-200 rounded-md'
    const inputClass =
        'w-full bg-off-white border border-gray-300 text-off-black py-2 px-3 rounded-md outline-none focus:border-blue transition-colors'

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-off-white rounded-2xl shadow-xl p-5 xl:p-8 flex flex-col gap-6 -mt-16 xl:-mt-24 relative z-10"
        >
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-6 xl:gap-8">
                {/* Left: form fields */}
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-off-black font-medium">Model</span>
                            <Dropdown
                                value={form.model}
                                onChange={setField('model')}
                                options={opts.models}
                                optionLabel="label"
                                placeholder="Model"
                                className={dropdownClass}
                                panelClassName={panelClass}
                                filter
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-off-black font-medium">Sentence</span>
                            <input
                                type="text"
                                value={form.sentence}
                                onChange={setField('sentence')}
                                placeholder="unleash your creativity…"
                                maxLength={255}
                                className={inputClass}
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-off-black font-medium">Type</span>
                            <Dropdown
                                value={form.type}
                                onChange={setField('type')}
                                options={opts.types}
                                optionLabel="label"
                                placeholder="Choose your type"
                                className={dropdownClass}
                                panelClassName={panelClass}
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-off-black font-medium">Design</span>
                            <Dropdown
                                value={form.design}
                                onChange={setField('design')}
                                options={opts.editions}
                                optionLabel="label"
                                placeholder="Choose Style"
                                className={dropdownClass}
                                panelClassName={panelClass}
                                filter
                            />
                        </label>
                    </div>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-off-black font-medium">Any Special Comments?</span>
                        <textarea
                            value={form.comments}
                            onChange={setField('comments')}
                            rows={4}
                            maxLength={1000}
                            placeholder="…"
                            className={`${inputClass} resize-none`}
                        />
                    </label>
                </div>

                {/* Right: illustrations */}
                <div className="flex gap-3 h-full">
                    <div className="relative w-full xl:w-72 h-56 xl:h-full rounded-xl overflow-hidden">
                        <Image src={BagImg} alt="Mutual gift bag" fill className="object-cover" />
                    </div>
                    <div className="relative hidden xl:block w-40 h-full rounded-xl overflow-hidden">
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
    )
}

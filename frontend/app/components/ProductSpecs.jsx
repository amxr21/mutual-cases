'use client'
import { useState } from 'react'

/**
 * "More Details" section for a product (Task 8 redesign).
 *
 * Richer, on-brand layout: a description lead-in, icon-led spec cards for
 * Material and Design Approach, and an animated expandable Features list with
 * check bullets. Each section renders only when its data exists.
 */

const MaterialIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
)
const ApproachIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
)

function SpecCard({ icon: Icon, label, children }) {
    return (
        <div className="flex gap-4 rounded-xl border border-blue/15 bg-blue/[0.03] p-4 transition-all duration-300 hover:border-blue/30 hover:shadow-sm">
            <div className="shrink-0 w-11 h-11 rounded-lg bg-blue text-off-white flex items-center justify-center">
                <Icon className="size-6 stroke-current" />
            </div>
            <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-blue">{label}</h4>
                <p className="font-light text-off-black/80 leading-relaxed">{children}</p>
            </div>
        </div>
    )
}

function ProductSpecs({ details }) {
    const features = String(details?.features || '')
        .split('|')
        .map((f) => f.trim())
        .filter(Boolean)

    const [open, setOpen] = useState(true)

    const hasAny = details?.description || details?.material || details?.approach || features.length
    if (!hasAny) return null

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <h3 className="text-xl xl:text-2xl font-semibold">More Details</h3>
                <span className="h-px grow bg-gradient-to-r from-blue/30 to-transparent" />
            </div>

            {details?.description ? (
                <p className="font-light text-off-black/80 leading-relaxed text-lg">{details.description}</p>
            ) : null}

            {(details?.material || details?.approach) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details?.material ? (
                        <SpecCard icon={MaterialIcon} label="Material">{details.material}</SpecCard>
                    ) : null}
                    {details?.approach ? (
                        <SpecCard icon={ApproachIcon} label="Design Approach">{details.approach}</SpecCard>
                    ) : null}
                </div>
            ) : null}

            {features.length ? (
                <div className="rounded-xl border border-blue/15 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-blue/[0.04] hover:bg-blue/[0.07] transition-colors"
                    >
                        <span className="text-sm font-semibold uppercase tracking-wide text-blue">Features</span>
                        <svg viewBox="0 0 24 24" fill="none" className={`size-5 stroke-blue transition-transform duration-300 ${open ? 'rotate-180' : ''}`} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-400 ease-out ${open ? 'max-h-96' : 'max-h-0'}`}>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4">
                            {features.map((f, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 font-light text-off-black/80 reveal"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-blue/10 flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" className="size-3.5 stroke-blue" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default ProductSpecs

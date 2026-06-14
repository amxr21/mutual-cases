'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Custom, animated select to replace native <select> (which can't animate its
 * OS-rendered panel). Smooth open/close (fade + scale + slide), keyboard- and
 * outside-click friendly, on-brand styling. Drop-in for the custom-it form and
 * anywhere a nicer dropdown is wanted.
 *
 * @param {string} value
 * @param {(v:string)=>void} onChange
 * @param {{label:string,value:string}[]|string[]} options
 * @param {string} placeholder
 */
const cap = (s) => String(s ?? '').replace(/\b\w/g, (c) => c.toUpperCase())

export default function SmoothSelect({ value, onChange, options = [], placeholder = 'Select…', className = '' }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const opts = options.map((o) => (typeof o === 'string' ? { label: cap(o), value: o } : o))
    const selected = opts.find((o) => o.value === value)

    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const choose = (v) => {
        onChange(v)
        setOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`w-full flex items-center justify-between gap-2 bg-off-white border rounded-md py-2.5 px-3 text-left transition-all duration-200 cursor-pointer
                    ${open ? 'border-blue ring-2 ring-blue/15' : 'border-gray-300 hover:border-blue/50'}`}
            >
                <span className={selected ? 'text-off-black' : 'text-off-black/45'}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg viewBox="0 0 24 24" fill="none" className={`size-4 shrink-0 stroke-off-black/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {/* Animated panel */}
            <div
                role="listbox"
                className={`absolute left-0 right-0 mt-1 z-50 bg-off-white border border-gray-200 rounded-md shadow-xl overflow-hidden origin-top transition-all duration-200 ${
                    open ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none'
                }`}
            >
                <div className="max-h-60 overflow-auto py-1">
                    {opts.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-off-black/50">No options</p>
                    ) : (
                        opts.map((o) => {
                            const active = o.value === value
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onClick={() => choose(o.value)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150 flex items-center justify-between
                                        ${active ? 'bg-blue text-off-white' : 'text-off-black hover:bg-blue/10'}`}
                                >
                                    {o.label}
                                    {active ? (
                                        <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : null}
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Admin-themed animated select — the same UX as the storefront SmoothSelect
 * (smooth open/close, outside-click + Escape to close, keyboard friendly), but
 * styled with the admin --ui-* tokens so it adapts to light/dark + accent.
 * Drop-in replacement for native <select> across admin pages.
 *
 * @param {string} value
 * @param {(v:string)=>void} onChange  receives the chosen value
 * @param {{label:string,value:string}[]|string[]} options
 * @param {string} placeholder
 * @param {boolean} disabled
 */
const cap = (s) => String(s ?? '').replace(/\b\w/g, (c) => c.toUpperCase())

export default function Select({ value, onChange, options = [], placeholder = 'Select…', className = '', disabled = false }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const opts = options.map((o) => (typeof o === 'string' ? { label: cap(o), value: o } : o))
    const selected = opts.find((o) => String(o.value) === String(value))

    useEffect(() => {
        if (!open) return
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const choose = (v) => { onChange(v); setOpen(false) }

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="ui-select w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                style={open ? { borderColor: 'var(--ui-primary)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ui-primary) 18%, transparent)' } : undefined}
            >
                <span style={{ color: selected ? 'var(--ui-text)' : 'var(--ui-text-muted)' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg viewBox="0 0 24 24" fill="none" className={`size-4 shrink-0 stroke-current transition-transform duration-300 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--ui-text-muted)' }} strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            <div
                role="listbox"
                className={`absolute left-0 right-0 mt-1 z-50 rounded-lg overflow-hidden origin-top transition-all duration-200 ${
                    open ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none'
                }`}
                style={{ background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', boxShadow: 'var(--ui-shadow)' }}
            >
                <div className="max-h-60 overflow-auto py-1">
                    {opts.length === 0 ? (
                        <p className="px-3 py-2 text-sm ui-muted">No options</p>
                    ) : (
                        opts.map((o) => {
                            const active = String(o.value) === String(value)
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onClick={() => choose(o.value)}
                                    className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 flex items-center justify-between"
                                    style={{
                                        background: active ? 'var(--ui-primary)' : 'transparent',
                                        color: active ? 'var(--ui-primary-contrast)' : 'var(--ui-text)',
                                    }}
                                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--ui-surface-2)' }}
                                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
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

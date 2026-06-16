'use client'
import { useEffect } from 'react'

/**
 * Right-side slide-in drawer for detail/edit panels (Strapi-style edit surface).
 * Animated in/out; closes on overlay click or Escape.
 */
export default function Drawer({ open, onClose, title, children, footer, width = '32rem' }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === 'Escape' && onClose?.()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    return (
        <div className={`fixed inset-0 z-[100000] ${open ? '' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div
                onClick={onClose}
                className={`ui-overlay absolute inset-0 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Panel */}
            <div
                className="absolute top-0 right-0 h-full flex flex-col transition-transform duration-300 ease-out ui-surface"
                style={{
                    width: `min(${width}, 100%)`,
                    transform: open ? 'translateX(0)' : 'translateX(100%)',
                    borderRadius: 0,
                    boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
                }}
            >
                <div className="flex items-center justify-between p-4 border-b ui-border">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>{title}</h2>
                    <button onClick={onClose} aria-label="Close" className="ui-btn ui-btn-ghost !px-2 !py-1">
                        <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="grow overflow-y-auto p-4">{children}</div>
                {footer ? <div className="p-4 border-t ui-border flex gap-2 justify-end">{footer}</div> : null}
            </div>
        </div>
    )
}

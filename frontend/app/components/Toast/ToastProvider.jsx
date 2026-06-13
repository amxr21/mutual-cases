'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/**
 * Themed toast/notification system — replaces window.alert across the app.
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success("Added to cart")
 *   toast.error("Something went wrong")
 *   toast.info("Please log in first")
 *
 * Toasts auto-dismiss, stack top-right, and follow the site theme (Fraunces,
 * brand blue/gold) with a slide+fade animation. Rendered once near the root.
 */

const ToastContext = createContext(null)

let idCounter = 0

const VARIANTS = {
    success: {
        bar: 'bg-blue',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-blue" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
        ),
    },
    error: {
        bar: 'bg-gold',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-gold" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M10.34 3.94l-7.6 13.16A1.5 1.5 0 004.04 19.5h15.92a1.5 1.5 0 001.3-2.4L13.66 3.94a1.5 1.5 0 00-2.6 0z" />
            </svg>
        ),
    },
    info: {
        bar: 'bg-light-blue',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-light-blue" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25h.75v4.5m-.75 0h1.5M12 7.5h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
}

function ToastItem({ toast, onDismiss }) {
    const [leaving, setLeaving] = useState(false)
    const variant = VARIANTS[toast.variant] || VARIANTS.info

    const dismiss = useCallback(() => {
        setLeaving(true)
        // Allow the exit animation to play before unmount.
        setTimeout(() => onDismiss(toast.id), 250)
    }, [onDismiss, toast.id])

    useEffect(() => {
        if (toast.duration === Infinity) return
        const t = setTimeout(dismiss, toast.duration)
        return () => clearTimeout(t)
    }, [dismiss, toast.duration])

    return (
        <div
            role="status"
            className={`pointer-events-auto flex items-stretch gap-0 overflow-hidden rounded-lg bg-off-white shadow-lg border border-black/5 min-w-[16rem] max-w-[22rem] transition-all duration-250 ease-out
                ${leaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
            style={{ fontFamily: 'var(--font-default), serif' }}
        >
            <div className={`w-1.5 shrink-0 ${variant.bar}`} />
            <div className="flex items-center gap-3 px-4 py-3 grow">
                <span className="shrink-0">{variant.icon}</span>
                <div className="grow">
                    {toast.title ? (
                        <p className="text-off-black font-semibold text-sm leading-tight">{toast.title}</p>
                    ) : null}
                    <p className="text-off-black/80 text-sm leading-snug">{toast.message}</p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="shrink-0 text-off-black/40 hover:text-off-black transition-colors"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const toastsRef = useRef(toasts)
    toastsRef.current = toasts

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const push = useCallback((message, { variant = 'info', title, duration = 3500 } = {}) => {
        const id = ++idCounter
        // Cap concurrent toasts so they never flood the screen.
        setToasts((prev) => [...prev.slice(-3), { id, message, variant, title, duration }])
        return id
    }, [])

    const api = useRef({
        show: push,
        success: (msg, opts) => push(msg, { ...opts, variant: 'success' }),
        error: (msg, opts) => push(msg, { ...opts, variant: 'error' }),
        info: (msg, opts) => push(msg, { ...opts, variant: 'info' }),
        dismiss: remove,
    })
    // Keep the latest closures.
    api.current.show = push
    api.current.success = (msg, opts) => push(msg, { ...opts, variant: 'success' })
    api.current.error = (msg, opts) => push(msg, { ...opts, variant: 'error' })
    api.current.info = (msg, opts) => push(msg, { ...opts, variant: 'info' })
    api.current.dismiss = remove

    return (
        <ToastContext.Provider value={api.current}>
            {children}
            <div
                className="fixed top-4 right-4 z-[1000000] flex flex-col gap-2 pointer-events-none"
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={remove} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

/**
 * Access the toast API. Falls back to a no-op-ish console reporter if used
 * outside the provider, so a missing provider never throws.
 */
export function useToast() {
    const ctx = useContext(ToastContext)
    if (ctx) return ctx
    return {
        show: (m) => console.warn('[toast:no-provider]', m),
        success: (m) => console.warn('[toast:no-provider]', m),
        error: (m) => console.warn('[toast:no-provider]', m),
        info: (m) => console.warn('[toast:no-provider]', m),
        dismiss: () => {},
    }
}

export default ToastProvider

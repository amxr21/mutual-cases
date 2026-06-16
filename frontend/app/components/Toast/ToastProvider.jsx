'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

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

// Admin variants — generic, using the dashboard --ui-* tokens so notifications
// match the rest of the admin (and adapt to dark mode + custom accent).
const ADMIN_ACCENT = {
    success: 'var(--ui-success)',
    error: 'var(--ui-danger)',
    info: 'var(--ui-primary)',
}
function AdminIcon({ variant }) {
    const color = ADMIN_ACCENT[variant] || ADMIN_ACCENT.info
    const d = variant === 'success'
        ? 'M4.5 12.75l6 6 9-13.5'
        : variant === 'error'
            ? 'M12 9v3.75m0 3.75h.008M10.34 3.94l-7.6 13.16A1.5 1.5 0 004.04 19.5h15.92a1.5 1.5 0 001.3-2.4L13.66 3.94a1.5 1.5 0 00-2.6 0z'
            : 'M11.25 11.25h.75v4.5m-.75 0h1.5M12 7.5h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    return (
        <svg viewBox="0 0 24 24" fill="none" className="size-5" style={{ stroke: color }} strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    )
}

function ToastItem({ toast, onDismiss, admin }) {
    const [entered, setEntered] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const variant = VARIANTS[toast.variant] || VARIANTS.info

    // Animate in on mount (next frame so the transition runs from the start state).
    useEffect(() => {
        const r = requestAnimationFrame(() => setEntered(true))
        return () => cancelAnimationFrame(r)
    }, [])

    const dismiss = useCallback(() => {
        setLeaving(true)
        // Allow the exit animation to play before unmount.
        setTimeout(() => onDismiss(toast.id), 400)
    }, [onDismiss, toast.id])

    useEffect(() => {
        if (toast.duration === Infinity) return
        const t = setTimeout(dismiss, toast.duration)
        return () => clearTimeout(t)
    }, [dismiss, toast.duration])

    // Smooth, springy in/out: slide + fade + slight scale.
    const visible = entered && !leaving
    const transition = {
        transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1), transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.96)',
    }

    // Admin: generic styling via --ui-* tokens (adapts to dark mode + accent).
    if (admin) {
        return (
            <div
                role="status"
                className="pointer-events-auto flex items-stretch overflow-hidden rounded-lg min-w-[15rem] max-w-[22rem]"
                style={{
                    background: 'var(--ui-surface)',
                    border: '1px solid var(--ui-border)',
                    boxShadow: 'var(--ui-float-shadow, 0 2px 10px rgba(0,0,0,0.08))',
                    fontFamily: 'var(--ui-font)',
                    ...transition,
                }}
            >
                <div className="w-1.5 shrink-0" style={{ background: ADMIN_ACCENT[toast.variant] || ADMIN_ACCENT.info }} />
                <div className="flex items-center gap-3 px-4 py-3 grow">
                    <span className="shrink-0"><AdminIcon variant={toast.variant} /></span>
                    <div className="grow">
                        {toast.title ? <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--ui-text)' }}>{toast.title}</p> : null}
                        <p className="text-sm leading-snug" style={{ color: 'var(--ui-text)' }}>{toast.message}</p>
                    </div>
                    <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 transition-opacity hover:opacity-100 opacity-50" style={{ color: 'var(--ui-text-muted)' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        )
    }

    // Storefront: brand styling (Fraunces, blue/gold).
    return (
        <div
            role="status"
            className="pointer-events-auto flex items-stretch gap-0 overflow-hidden rounded-lg bg-off-white shadow-lg border border-black/5 min-w-[15rem] max-w-[22rem]"
            style={{ fontFamily: 'var(--font-default), serif', ...transition }}
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
    // Admin routes get generic, --ui-* themed toasts; storefront gets brand ones.
    const pathname = usePathname()
    const isAdmin = pathname?.startsWith('/admin')
    // Mirror the page's admin dark-mode + custom accent onto the toast container
    // so toasts match the live dashboard theme (the container lives at app root,
    // outside the page's .admin-root).
    const [adminDark, setAdminDark] = useState(false)
    useEffect(() => {
        if (!isAdmin) return
        const root = document.querySelector('.admin-root')
        if (root) setAdminDark(root.classList.contains('dark'))
    }, [isAdmin, toasts.length])

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
            {/* Aligned to the navbar's line: matches the navbar's right margin
                (mx-8 / xl:mx-20) and sits on the nav row near the top. */}
            <div
                className={`${isAdmin ? `admin-root ${adminDark ? 'dark' : ''} ` : ''}fixed top-6 xl:top-10 right-8 xl:right-20 z-[1000000] flex flex-col gap-2 pointer-events-none`}
                style={isAdmin ? { background: 'transparent', minHeight: 0 } : undefined}
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={remove} admin={isAdmin} />
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

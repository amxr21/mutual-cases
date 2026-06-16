'use client'
import { useEffect } from 'react'

/**
 * Reusable confirm dialog for destructive/important actions (delete, cancel).
 * Controlled via `open`; calls onConfirm / onClose.
 */
export default function ConfirmDialog({
    open,
    onConfirm,
    onClose,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    danger = true,
    busy = false,
}) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === 'Escape' && onClose?.()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    return (
        <div className={`fixed inset-0 z-[100001] flex items-center justify-center p-4 transition-all duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="ui-overlay absolute inset-0" onClick={onClose} />
            <div
                role="alertdialog"
                className="relative ui-surface w-full max-w-sm p-6 flex flex-col gap-3 transition-transform duration-200"
                style={{ transform: open ? 'scale(1)' : 'scale(0.96)' }}
            >
                <h3 className="text-lg font-semibold" style={{ color: 'var(--ui-text)' }}>{title}</h3>
                {message ? <p className="ui-muted text-sm">{message}</p> : null}
                <div className="flex gap-2 justify-end mt-2">
                    <button className="ui-btn ui-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
                    <button
                        className={`ui-btn ${danger ? 'ui-btn-danger' : 'ui-btn-primary'}`}
                        onClick={onConfirm}
                        disabled={busy}
                        style={danger ? { background: 'var(--ui-danger)', color: '#fff', borderColor: 'var(--ui-danger)' } : undefined}
                    >
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

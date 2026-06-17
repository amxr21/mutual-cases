'use client'
/**
 * Themed message container for admin loading / empty / error / access states.
 * Replaces bare <p> states so every message sits in an on-theme card that
 * adapts to light/dark + accent. Variants pick an icon + tone.
 */
const ICONS = {
    error: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
    empty: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
    denied: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
    info: 'M11.25 11.25h.75v4.5m-.75 0h1.5M12 7.5h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}
const TONES = {
    error: 'var(--ui-danger)',
    empty: 'var(--ui-text-muted)',
    denied: 'var(--ui-primary)',
    info: 'var(--ui-primary)',
}

export default function AdminMessage({ variant = 'info', title, message, action }) {
    const color = TONES[variant] || TONES.info
    return (
        <div className="ui-surface p-8 flex flex-col items-center text-center gap-3">
            <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--ui-surface-2)' }}>
                <svg viewBox="0 0 24 24" fill="none" className="size-6" style={{ stroke: color }} strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[variant] || ICONS.info} />
                </svg>
            </span>
            {title ? <h3 className="font-semibold" style={{ color: 'var(--ui-text)' }}>{title}</h3> : null}
            {message ? <p className="ui-muted text-sm max-w-md">{message}</p> : null}
            {action ? <div className="mt-1">{action}</div> : null}
        </div>
    )
}

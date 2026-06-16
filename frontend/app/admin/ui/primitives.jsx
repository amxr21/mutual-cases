'use client'
/**
 * Small admin UI primitives (Medusa-style). Generic + reusable across projects.
 * Styling comes from admin.css (ui-* classes + theme tokens), so they adapt to
 * light/dark automatically.
 */

export function Button({ variant = 'primary', as, href, className = '', children, ...props }) {
    const cls = `ui-btn ui-btn-${variant} ${className}`
    if (as === 'a' || href) {
        // Lightweight anchor variant (use next/link at call sites when routing).
        return <a href={href} className={cls} {...props}>{children}</a>
    }
    return <button className={cls} {...props}>{children}</button>
}

const BADGE_TONES = {
    neutral: { bg: 'var(--ui-surface-2)', fg: 'var(--ui-text-muted)' },
    blue: { bg: 'color-mix(in srgb, var(--ui-primary) 15%, transparent)', fg: 'var(--ui-primary)' },
    green: { bg: 'color-mix(in srgb, var(--ui-success) 18%, transparent)', fg: 'var(--ui-success)' },
    gold: { bg: 'color-mix(in srgb, var(--ui-accent) 20%, transparent)', fg: 'var(--ui-accent)' },
    red: { bg: 'color-mix(in srgb, var(--ui-danger) 15%, transparent)', fg: 'var(--ui-danger)' },
}

export function Badge({ tone = 'neutral', children }) {
    const t = BADGE_TONES[tone] || BADGE_TONES.neutral
    return <span className="ui-badge" style={{ background: t.bg, color: t.fg }}>{children}</span>
}

export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--ui-text)' }}>{title}</h1>
                {subtitle ? <p className="ui-muted text-sm mt-1">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
    )
}

export function StatCard({ label, value, sub, tone = 'blue', icon }) {
    return (
        <div className="ui-surface p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <span className="ui-muted text-sm">{label}</span>
                {icon ? (
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--ui-surface-2)' }}>{icon}</span>
                ) : null}
            </div>
            <span className="text-3xl font-bold" style={{ color: tone === 'gold' ? 'var(--ui-accent)' : 'var(--ui-text)' }}>
                {value}
            </span>
            {sub ? <span className="ui-muted text-xs">{sub}</span> : null}
        </div>
    )
}

export function FormField({ label, hint, error, children }) {
    return (
        <label className="flex flex-col gap-1.5 text-sm">
            {label ? <span className="font-medium" style={{ color: 'var(--ui-text)' }}>{label}</span> : null}
            {children}
            {error ? <span className="text-xs" style={{ color: 'var(--ui-danger)' }}>{error}</span> : null}
            {hint && !error ? <span className="ui-muted text-xs">{hint}</span> : null}
        </label>
    )
}

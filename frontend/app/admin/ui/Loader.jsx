'use client'
/**
 * Interactive loading indicator for admin pages — an animated spinner + label,
 * themed with --ui-* tokens. Replaces plain "Loading…" text. Optionally renders
 * a shimmer skeleton (rows) for table-like screens.
 */
export default function Loader({ label = 'Loading…', rows = 0 }) {
    if (rows > 0) {
        return (
            <div className="ui-surface overflow-hidden">
                <div className="p-3 border-b ui-border"><Bar w="14rem" /></div>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 border-b ui-border last:border-0">
                        <Bar w="2rem" /><Bar w="8rem" /><Bar w="12rem" /><Bar w="5rem" className="ml-auto" />
                    </div>
                ))}
            </div>
        )
    }
    return (
        <div className="flex items-center gap-3 py-8 ui-muted">
            <Spinner />
            <span className="text-sm">{label}</span>
        </div>
    )
}

export function Spinner({ size = 18 }) {
    return (
        <span
            className="inline-block rounded-full animate-spin shrink-0"
            style={{
                width: size, height: size,
                border: '2px solid color-mix(in srgb, var(--ui-primary) 25%, transparent)',
                borderTopColor: 'var(--ui-primary)',
            }}
        />
    )
}

function Bar({ w = '6rem', className = '' }) {
    return (
        <span
            className={`block h-3 rounded ${className}`}
            style={{
                width: w,
                background: 'linear-gradient(90deg, var(--ui-surface-2) 25%, color-mix(in srgb, var(--ui-text) 8%, var(--ui-surface-2)) 50%, var(--ui-surface-2) 75%)',
                backgroundSize: '200% 100%',
                animation: ' uiShimmer 1.3s ease-in-out infinite',
            }}
        />
    )
}

'use client'
import { useEffect } from 'react'
import { reportClientError } from './lib/clientLogger'

/**
 * Root-level error boundary. Catches errors thrown in the root layout itself
 * (where the normal error.jsx can't reach). Must render its own <html>/<body>.
 * Kept dependency-free and self-contained so it works even if shared modules
 * are what failed.
 */
export default function GlobalError({ error, reset }) {
    useEffect(() => {
        reportClientError({
            source: 'global-error',
            message: error?.message || 'Root layout crashed',
            stack: error?.stack,
            digest: error?.digest,
            component: 'global-error',
        })
    }, [error])

    return (
        <html lang="en">
            <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#1d4ed8',
                    }}
                >
                    <p style={{ fontSize: '6rem', margin: 0, lineHeight: 1 }}>500</p>
                    <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>
                        Oops… something went wrong
                    </h1>
                    <p style={{ maxWidth: '32rem', opacity: 0.8 }}>
                        The page failed to load. This is on our side, not yours. Please try again.
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => reset()}
                            style={{
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                fontSize: '1rem',
                            }}
                        >
                            Try again
                        </button>
                        <a href="/" style={{ textDecoration: 'underline', color: 'inherit' }}>
                            Go back to Homepage
                        </a>
                    </div>
                </div>
            </body>
        </html>
    )
}

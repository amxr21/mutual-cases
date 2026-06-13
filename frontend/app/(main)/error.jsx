'use client'
import { useEffect } from 'react'
import ErrorState from '../components/ErrorState'
import { reportClientError } from '../lib/clientLogger'

/**
 * Route-group boundary for /(main) pages (products, cart, about, custom-it).
 * Isolates a crash in any of these pages so the rest of the app (nav, footer,
 * other routes) keeps working.
 */
export default function MainError({ error, reset }) {
    useEffect(() => {
        reportClientError({
            source: 'error-boundary',
            message: error?.message || 'Section error',
            stack: error?.stack,
            digest: error?.digest,
            component: '(main)/error',
        })
    }, [error])

    return (
        <ErrorState
            code="500"
            title="This section hit a snag"
            message="We couldn't load this page right now. Try again, or return to the homepage."
            onRetry={() => reset()}
        />
    )
}

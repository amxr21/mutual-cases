'use client'
import { useEffect } from 'react'
import ErrorState from './components/ErrorState'
import { reportClientError } from './lib/clientLogger'

/**
 * App-level error boundary for the page tree (everything rendered inside the
 * root layout). Reports the error and shows a friendly, recoverable fallback.
 */
export default function Error({ error, reset }) {
    useEffect(() => {
        reportClientError({
            source: 'error-boundary',
            message: error?.message || 'Page error',
            stack: error?.stack,
            digest: error?.digest,
            component: 'app/error',
        })
    }, [error])

    return (
        <ErrorState
            code="500"
            title="Oops… something went wrong"
            message="This page ran into a problem. You can try again, or head back to the homepage."
            onRetry={() => reset()}
        />
    )
}

'use client'
import { useEffect } from 'react'
import ErrorState from '../../components/ErrorState'
import { reportClientError } from '../../lib/clientLogger'

/**
 * Boundary for the products pages (listing + detail). A failure fetching or
 * rendering products is contained here instead of taking down the section.
 */
export default function ProductsError({ error, reset }) {
    useEffect(() => {
        reportClientError({
            source: 'error-boundary',
            message: error?.message || 'Products error',
            stack: error?.stack,
            digest: error?.digest,
            component: 'products/error',
        })
    }, [error])

    return (
        <ErrorState
            title="We couldn't load the products"
            message="There was a problem loading this page. Please try again in a moment."
            onRetry={() => reset()}
        />
    )
}

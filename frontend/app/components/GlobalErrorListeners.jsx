'use client'
import { useEffect } from 'react'
import { installGlobalErrorListeners } from '../lib/clientLogger'

/**
 * Mount once near the root. Installs window 'error' and 'unhandledrejection'
 * listeners that report to the client-log endpoint. Renders nothing.
 *
 * These catch errors that React error boundaries cannot — async/event-handler
 * throws and unhandled promise rejections — so they still reach the log file
 * instead of vanishing into the console.
 */
export default function GlobalErrorListeners() {
    useEffect(() => {
        installGlobalErrorListeners()
    }, [])

    return null
}

'use client'
import { useEffect, useState } from 'react'

const KEY = 'mutual_admin_theme'

/** Reads/writes the admin theme on the .admin-root element + localStorage. */
export function useAdminTheme() {
    const [theme, setTheme] = useState('light')

    useEffect(() => {
        const saved = (typeof window !== 'undefined' && localStorage.getItem(KEY)) || 'light'
        setTheme(saved)
    }, [])

    const apply = (t) => {
        setTheme(t)
        if (typeof document !== 'undefined') {
            const root = document.querySelector('.admin-root')
            if (root) root.classList.toggle('dark', t === 'dark')
        }
        try { localStorage.setItem(KEY, t) } catch { /* ignore */ }
    }

    // Keep the DOM class in sync whenever theme changes (e.g. on mount).
    useEffect(() => {
        const root = document.querySelector('.admin-root')
        if (root) root.classList.toggle('dark', theme === 'dark')
    }, [theme])

    return { theme, toggle: () => apply(theme === 'dark' ? 'light' : 'dark') }
}

export default function ThemeToggle() {
    const { theme, toggle } = useAdminTheme()
    return (
        <button onClick={toggle} className="ui-btn ui-btn-ghost !px-2" aria-label="Toggle theme" title="Toggle theme">
            {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            )}
        </button>
    )
}

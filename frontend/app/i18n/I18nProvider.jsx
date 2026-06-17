'use client'
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { DICTS } from './dictionaries'

/**
 * Lightweight i18n for the storefront. Holds the active language (en|ar),
 * exposes t(key) and a setLang, persists the choice, and keeps <html lang/dir>
 * in sync so RTL applies for Arabic. Dynamic DB content is shown as-is.
 */
const I18nContext = createContext(null)
const KEY = 'mutual_lang'
const RTL = new Set(['ar'])

// Arabic is temporarily disabled (translations need polishing). The i18n layer
// stays wired up; only the language switch is hidden — flip this to re-enable it.
export const LANG_ENABLED = false

export function I18nProvider({ children }) {
    const [lang, setLangState] = useState('en')

    // Restore the saved language on mount + apply lang/dir to <html>.
    // While LANG_ENABLED is false we force English so stale saved choices
    // (e.g. a tester left in 'ar') can't keep the UI stuck in RTL.
    useEffect(() => {
        if (!LANG_ENABLED) { setLangState('en'); return }
        let initial = 'en'
        try { initial = localStorage.getItem(KEY) || 'en' } catch { /* ignore */ }
        setLangState(initial)
    }, [])

    useEffect(() => {
        if (typeof document === 'undefined') return
        const el = document.documentElement
        el.setAttribute('lang', lang)
        el.setAttribute('dir', RTL.has(lang) ? 'rtl' : 'ltr')
    }, [lang])

    const setLang = useCallback((l) => {
        setLangState(l)
        try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
    }, [])

    const t = useCallback((key, fallback) => {
        const dict = DICTS[lang] || DICTS.en
        return dict[key] ?? DICTS.en[key] ?? fallback ?? key
    }, [lang])

    const value = useMemo(() => ({ lang, setLang, t, isRTL: RTL.has(lang) }), [lang, setLang, t])
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const ctx = useContext(I18nContext)
    // Safe fallback if used outside the provider (English, identity t).
    if (!ctx) return { lang: 'en', setLang: () => {}, t: (k, f) => f ?? k, isRTL: false }
    return ctx
}

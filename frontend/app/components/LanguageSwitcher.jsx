'use client'
import { useI18n } from '../i18n/I18nProvider'

/** EN / ع toggle for the storefront. Switching applies RTL for Arabic. */
export default function LanguageSwitcher({ className = '' }) {
    const { lang, setLang } = useI18n()
    return (
        <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            aria-label="Change language"
            title={lang === 'ar' ? 'English' : 'العربية'}
            className={`min-w-9 h-9 px-2 flex items-center justify-center rounded-lg font-semibold text-sm transition-colors hover:bg-blue/10 text-blue ${className}`}
        >
            {lang === 'ar' ? 'EN' : 'ع'}
        </button>
    )
}

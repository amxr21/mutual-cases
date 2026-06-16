'use client'
import { useEffect, useState } from 'react'
import { getJSON, putJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'
import { PageHeader, FormField } from '../ui/primitives'
import ImageUpload from '../ui/ImageUpload'

/**
 * Settings module. Sections:
 *   - Brand:        store name + logo (shown in the sidebar header).
 *   - Theme:        light/dark mode + accent color (drives --ui-primary).
 *   - Customization: admin font.
 * All backed by the /admin/settings key/value store. Later phases add Region/
 * Currency, VAT/TRN, and notification templates here.
 */

const FONTS = [
    { id: 'system', label: 'SF Pro / Inter (default)', stack: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", var(--font-inter), "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    { id: 'inter', label: 'Inter', stack: 'var(--font-inter), "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' },
    { id: 'grotesk', label: 'Grotesk', stack: '"Segoe UI", "Open Sans", "Helvetica Neue", Arial, sans-serif' },
    { id: 'mono', label: 'Monospace', stack: 'ui-monospace, "Cascadia Code", "Courier New", monospace' },
    { id: 'serif', label: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
]

const ACCENTS = ['#055AB0', '#7c3aed', '#0ea5e9', '#16a34a', '#DFA61D', '#e11d48', '#0f172a']

const FONT_KEY = 'mutual_admin_font'

function root() { return typeof document !== 'undefined' ? document.querySelector('.admin-root') : null }
function applyFont(stack) { const r = root(); if (r) r.style.setProperty('--ui-font', stack) }
function applyAccent(color) { const r = root(); if (r) r.style.setProperty('--ui-primary', color) }
function applyMode(mode) { const r = root(); if (r) r.classList.toggle('dark', mode === 'dark') }

export default function AdminSettings() {
    const toast = useToast()
    // Brand
    const [brand, setBrand] = useState({ name: '', logoUrl: '', trn: '', email: '', phone: '' })
    // Theme
    const [theme, setTheme] = useState({ mode: 'light', accent: '#055AB0' })
    // Customization
    const [fontId, setFontId] = useState('system')
    // Storefront flags
    const [storefront, setStorefront] = useState({ locationAutodetect: false })
    const [busy, setBusy] = useState('')

    useEffect(() => {
        let active = true
        ;(async () => {
            const [sp, th, cz, sf] = await Promise.all([
                getJSON('/admin/settings/store_profile'),
                getJSON('/admin/settings/theme'),
                getJSON('/admin/settings/customization'),
                getJSON('/admin/settings/storefront'),
            ])
            if (!active) return
            if (sp.ok && sp.data?.value) setBrand((b) => ({ ...b, ...sp.data.value }))
            if (th.ok && th.data?.value) setTheme((t) => ({ ...t, ...th.data.value }))
            if (sf.ok && sf.data?.value) setStorefront((s) => ({ ...s, ...sf.data.value }))
            const savedFont = cz.ok ? cz.data?.value?.adminFont : null
            const local = typeof window !== 'undefined' ? localStorage.getItem(FONT_KEY) : null
            setFontId(savedFont || FONTS.find((f) => f.stack === local)?.id || 'system')
        })()
        return () => { active = false }
    }, [])

    const saveStorefront = async (next) => {
        setStorefront(next)
        setBusy('storefront')
        const r = await putJSON('/admin/settings/storefront', { value: next })
        setBusy('')
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        toast.success('Storefront settings saved')
    }

    const setB = (k) => (e) => setBrand((b) => ({ ...b, [k]: e.target.value }))

    const saveBrand = async () => {
        setBusy('brand')
        const r = await putJSON('/admin/settings/store_profile', { value: brand })
        setBusy('')
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        // Tell the admin shell to refresh the sidebar logo/name live (no reload).
        try { window.dispatchEvent(new CustomEvent('mutual:brand-updated', { detail: { name: brand.name, logoUrl: brand.logoUrl } })) } catch { /* ignore */ }
        toast.success('Brand saved')
    }

    const chooseAccent = (color) => { setTheme((t) => ({ ...t, accent: color })); applyAccent(color) }
    const chooseMode = (mode) => { setTheme((t) => ({ ...t, mode })); applyMode(mode) }

    const saveTheme = async () => {
        setBusy('theme')
        const r = await putJSON('/admin/settings/theme', { value: theme })
        setBusy('')
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        // Persist mode for ThemeToggle's own key so they stay consistent.
        try { localStorage.setItem('mutual_admin_theme', theme.mode) } catch { /* ignore */ }
        applyAccent(theme.accent); applyMode(theme.mode)
        toast.success('Theme saved')
    }

    const chooseFont = (id) => { setFontId(id); applyFont((FONTS.find((f) => f.id === id) || FONTS[0]).stack) }

    const saveFont = async () => {
        const font = FONTS.find((f) => f.id === fontId) || FONTS[0]
        setBusy('font')
        const r = await putJSON('/admin/settings/customization', { value: { adminFont: font.id } })
        setBusy('')
        if (!r.ok) { toast.error(r.error?.message || 'Save failed'); return }
        try { localStorage.setItem(FONT_KEY, font.stack) } catch { /* ignore */ }
        applyFont(font.stack)
        toast.success('Customization saved')
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader title="Settings" subtitle="Configure your store and admin dashboard" />

            {/* Responsive multi-column grid of setting sections. Brand spans full
                width (it's the widest); Theme + Customization sit side by side. */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            {/* Brand */}
            <Section title="Brand" desc="Your store name and logo. The logo appears in the dashboard sidebar." className="xl:col-span-2">
                <FormField label="Logo">
                    <ImageUpload value={brand.logoUrl} onChange={(url) => setBrand((b) => ({ ...b, logoUrl: url }))} folder="mutual/brand" />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Store name"><input value={brand.name} onChange={setB('name')} className="ui-input" placeholder="Mutual" /></FormField>
                    <FormField label="TRN" hint="Tax registration number"><input value={brand.trn} onChange={setB('trn')} className="ui-input" /></FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Contact email"><input value={brand.email} onChange={setB('email')} className="ui-input" type="email" /></FormField>
                    <FormField label="Contact phone"><input value={brand.phone} onChange={setB('phone')} className="ui-input" /></FormField>
                </div>
                <SaveRow busy={busy === 'brand'} onClick={saveBrand} />
            </Section>

            {/* Theme */}
            <Section title="Theme" desc="Appearance of the admin dashboard.">
                <FormField label="Mode">
                    <div className="flex gap-2">
                        {['light', 'dark'].map((m) => (
                            <button key={m} type="button" onClick={() => chooseMode(m)} className="ui-btn capitalize"
                                style={{ background: theme.mode === m ? 'var(--ui-primary)' : 'transparent', color: theme.mode === m ? 'var(--ui-primary-contrast)' : 'var(--ui-text)', border: theme.mode === m ? 'none' : '1px solid var(--ui-border)' }}>
                                {m}
                            </button>
                        ))}
                    </div>
                </FormField>
                <FormField label="Accent color">
                    <div className="flex flex-wrap gap-2">
                        {ACCENTS.map((c) => (
                            <button key={c} type="button" onClick={() => chooseAccent(c)} aria-label={c}
                                className="w-8 h-8 rounded-full transition-transform"
                                style={{ background: c, outline: theme.accent === c ? '2px solid var(--ui-text)' : 'none', outlineOffset: '2px' }} />
                        ))}
                        <input type="color" value={theme.accent} onChange={(e) => chooseAccent(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" aria-label="Custom accent" />
                    </div>
                </FormField>
                <SaveRow busy={busy === 'theme'} onClick={saveTheme} />
            </Section>

            {/* Customization */}
            <Section title="Customization" desc="The font used across the admin dashboard.">
                <FormField label="Admin font">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FONTS.map((f) => {
                            const active = fontId === f.id
                            return (
                                <button key={f.id} type="button" onClick={() => chooseFont(f.id)} className="text-left p-3 rounded-lg border transition-colors"
                                    style={{ borderColor: active ? 'var(--ui-primary)' : 'var(--ui-border)', background: active ? 'color-mix(in srgb, var(--ui-primary) 8%, transparent)' : 'var(--ui-surface)', boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--ui-primary) 18%, transparent)' : 'none' }}>
                                    <span className="block text-sm font-semibold" style={{ color: 'var(--ui-text)' }}>{f.label}</span>
                                    <span className="block text-lg mt-1" style={{ fontFamily: f.stack, color: 'var(--ui-text)' }}>Aa Bb Cc 123</span>
                                </button>
                            )
                        })}
                    </div>
                </FormField>
                <SaveRow busy={busy === 'font'} onClick={saveFont} />
            </Section>

            {/* Storefront */}
            <Section title="Storefront" desc="Customer-facing checkout behaviour.">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ color: 'var(--ui-text)' }}>Location autodetect</span>
                        <span className="ui-muted text-xs mt-1 max-w-md">
                            Shows a “Use my location” button on checkout that prefills the customer’s country, city, and area from their device. Off by default.
                        </span>
                    </div>
                    <Toggle
                        checked={!!storefront.locationAutodetect}
                        disabled={busy === 'storefront'}
                        onChange={(v) => saveStorefront({ ...storefront, locationAutodetect: v })}
                    />
                </div>
            </Section>
            </div>
        </div>
    )
}

function Section({ title, desc, children, className = '' }) {
    return (
        <div className={`ui-surface p-5 flex flex-col gap-5 ${className}`}>
            <div>
                <h2 className="font-semibold" style={{ color: 'var(--ui-text)' }}>{title}</h2>
                {desc ? <p className="ui-muted text-sm mt-1">{desc}</p> : null}
            </div>
            {children}
        </div>
    )
}

function SaveRow({ busy, onClick }) {
    return (
        <div className="flex justify-end">
            <button className="ui-btn ui-btn-primary" onClick={onClick} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
    )
}

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60"
            style={{ background: checked ? 'var(--ui-primary)' : 'var(--ui-surface-2)', border: '1px solid var(--ui-border)' }}
        >
            <span
                className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform"
                style={{ width: '1.1rem', height: '1.1rem', transform: checked ? 'translateX(1.25rem)' : 'translateX(0)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            />
        </button>
    )
}

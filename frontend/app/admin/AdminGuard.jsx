'use client'
import './admin.css'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getJSON } from '../lib/safeFetch'
import ThemeToggle from './ui/ThemeToggle'

/**
 * Admin shell (Medusa-style): collapsible grouped sidebar + topbar with
 * breadcrumbs and a dark-mode toggle. Generic and reusable — add nav items to
 * NAV_GROUPS and drop pages under /admin. Auth is gated client-side here for UX;
 * the API enforces admin server-side regardless.
 */
const NAV_GROUPS = [
    {
        label: 'General',
        items: [{ href: '/admin', label: 'Overview', exact: true, desc: 'Store at a glance — KPIs, recent orders, and pending actions.', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }],
    },
    {
        label: 'Commerce',
        items: [
            { href: '/admin/orders', label: 'Orders', desc: 'View orders, update status, and notify customers.', icon: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z' },
            { href: '/admin/products', label: 'Products', desc: 'Manage your catalog — create, edit, and remove products.', icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9' },
            { href: '/admin/inventory', label: 'Inventory', desc: 'Track stock, reserved/available units, thresholds, and adjustments.', icon: 'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776' },
            { href: '/admin/custom-requests', label: 'Custom Requests', desc: 'Review “design your own cover” submissions from customers.', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
            { href: '/admin/reviews', label: 'Reviews', desc: 'Moderate reviews — approve, reject, reply, and flag.', icon: 'M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25' },
            { href: '/admin/returns', label: 'Returns', desc: 'Approve returns, restock items, and issue refunds or store credit.', icon: 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' },
            { href: '/admin/discounts', label: 'Discounts', desc: 'Create and manage discount codes, limits, and expiry.', icon: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.567 3z M6 6h.008v.008H6V6z' },
        ],
    },
    {
        label: 'People',
        items: [
            { href: '/admin/customers', label: 'Customers', desc: 'Manage customer accounts, contact details, roles, and orders.', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
            { href: '/admin/delivery', label: 'Delivery', desc: 'Manage delivery staff — contact, vehicle, coverage zone, and availability.', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' }],
    },
    {
        label: 'Insights',
        items: [{ href: '/admin/reports', label: 'Reports', desc: 'Sales, VAT, customer, and discount reports with CSV export.', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' }],
    },
    {
        label: 'System',
        items: [
            { href: '/admin/staff', label: 'Staff & access', desc: 'Admin roles, permissions, and the activity log.', icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
            { href: '/admin/settings', label: 'Settings', desc: 'Brand, theme, customization, and store configuration.', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }],
    },
]

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

function NavIcon({ d }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 stroke-current" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    )
}

export default function AdminGuard({ children }) {
    const pathname = usePathname()
    const [state, setState] = useState('checking') // checking | ok | denied
    const [collapsed, setCollapsed] = useState(false)
    const [brand, setBrand] = useState({ name: '', logoUrl: '' })
    const [hovered, setHovered] = useState(null) // href of nav item being hovered
    const [unread, setUnread] = useState(0)

    useEffect(() => {
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        setState(token && role === 'admin' ? 'ok' : 'denied')
        try {
            setCollapsed(localStorage.getItem('mutual_admin_collapsed') === '1')
        } catch { /* ignore */ }
        // Apply the saved admin font (Settings > Customization) on mount. Set it
        // on .admin-root since that element redefines --ui-font (a value on
        // :root would be shadowed by the local definition).
        try {
            const font = localStorage.getItem('mutual_admin_font')
            if (font) {
                const root = document.querySelector('.admin-root')
                if (root) root.style.setProperty('--ui-font', font)
            }
        } catch { /* ignore */ }
        // Load brand (name + logo) from settings for the sidebar header. Only
        // attempt when we have an admin token (the endpoint is admin-gated).
        if (token && role === 'admin') {
            ;(async () => {
                const root = document.querySelector('.admin-root')
                const [sp, th] = await Promise.all([
                    getJSON('/admin/settings/store_profile'),
                    getJSON('/admin/settings/theme'),
                ])
                if (sp.ok && sp.data?.value) {
                    setBrand({ name: sp.data.value.name || '', logoUrl: sp.data.value.logoUrl || '' })
                }
                // Apply saved accent always. Apply the saved MODE only if the
                // admin has explicitly chosen one (localStorage key set); otherwise
                // leave whatever the OS-default (from ThemeToggle) resolved to.
                if (th.ok && th.data?.value && root) {
                    if (th.data.value.accent) root.style.setProperty('--ui-primary', th.data.value.accent)
                    const hasExplicitMode = (() => { try { return !!localStorage.getItem('mutual_admin_theme') } catch { return false } })()
                    if (hasExplicitMode && th.data.value.mode) root.classList.toggle('dark', th.data.value.mode === 'dark')
                }
            })()
        }
    }, [])

    // Live-update the sidebar brand when Settings saves it (no reload needed).
    useEffect(() => {
        const onBrand = (e) => setBrand({ name: e.detail?.name || '', logoUrl: e.detail?.logoUrl || '' })
        window.addEventListener('mutual:brand-updated', onBrand)
        return () => window.removeEventListener('mutual:brand-updated', onBrand)
    }, [])

    // Poll the unread notification count (also refreshes when the notifications
    // page marks things read, via the 'mutual:notifications-seen' event).
    useEffect(() => {
        if (state !== 'ok') return
        let active = true
        const fetchCount = async () => {
            const r = await getJSON('/admin/notifications')
            if (active && r.ok) setUnread(r.data?.counts?.total || 0)
        }
        fetchCount()
        const id = setInterval(fetchCount, 60000)
        const onSeen = () => setUnread(0)
        window.addEventListener('mutual:notifications-seen', onSeen)
        return () => { active = false; clearInterval(id); window.removeEventListener('mutual:notifications-seen', onSeen) }
    }, [state, pathname])

    const toggleCollapsed = () => {
        setCollapsed((c) => {
            const next = !c
            try { localStorage.setItem('mutual_admin_collapsed', next ? '1' : '0') } catch { /* ignore */ }
            return next
        })
    }

    if (state === 'checking') {
        return <div className="admin-root flex items-center justify-center min-h-screen ui-muted">Checking access…</div>
    }

    if (state === 'denied') {
        return (
            <div className="admin-root flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--ui-surface-2)' }}>
                    <svg viewBox="0 0 24 24" fill="none" className="size-8" style={{ stroke: 'var(--ui-primary)' }} strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-semibold" style={{ color: 'var(--ui-text)' }}>Admin access required</h1>
                <p className="ui-muted">Sign in as an administrator to view this page.</p>
                <Link href="/" className="ui-btn ui-btn-primary">Back to store</Link>
            </div>
        )
    }

    // Active item for breadcrumb.
    const active = ALL_ITEMS.find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href) && i.href !== '/admin')) ||
        (pathname === '/admin' ? ALL_ITEMS[0] : null)

    return (
        <div className="admin-root flex min-h-screen gap-4 p-4">
            {/* Floating sidebar — detached from the edges, rounded, soft-shadowed. */}
            <aside
                className="ui-float flex flex-col transition-all duration-300 sticky top-4 self-start shrink-0 z-40"
                style={{ width: collapsed ? '4.5rem' : '15rem', minHeight: 'calc(100vh - 2rem)' }}
            >
                <div className={`flex items-center gap-2 h-16 border-b ui-border shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
                    {/* Square logo placeholder; shows the uploaded brand logo if set in Settings. */}
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                        style={{ background: brand.logoUrl ? 'transparent' : 'var(--ui-surface-2)', border: '1px solid var(--ui-border)' }}
                        title={brand.name || 'Logo'}
                    >
                        {brand.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={brand.logoUrl} alt={brand.name || 'Logo'} className="w-full h-full object-contain" />
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" className="size-5" style={{ stroke: 'var(--ui-text-muted)' }} strokeWidth={1.6}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 3.75h16.5v16.5H3.75V3.75z" />
                            </svg>
                        )}
                    </div>
                    {!collapsed ? <span className="ui-muted text-xs ml-auto">Admin</span> : null}
                </div>

                <nav className={`flex flex-col p-3 grow overflow-visible ${collapsed ? 'gap-2' : 'gap-2.5'}`}>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="flex flex-col gap-0.5">
                            {!collapsed ? (
                                <span className="ui-muted text-[0.65rem] font-semibold uppercase tracking-wider px-3 mb-0.5 opacity-70">{group.label}</span>
                            ) : <div className="h-px mx-2 my-1" style={{ background: 'var(--ui-border)' }} />}
                            {group.items.map((item) => {
                                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                                return (
                                    <div
                                        key={item.href}
                                        className="relative"
                                        onMouseEnter={() => setHovered(item.href)}
                                        onMouseLeave={() => setHovered((h) => (h === item.href ? null : h))}
                                    >
                                        <Link
                                            href={item.href}
                                            className={`flex items-center py-[0.4rem] rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
                                            style={{
                                                background: isActive ? 'var(--ui-primary)' : 'transparent',
                                                color: isActive ? 'var(--ui-primary-contrast)' : 'var(--ui-text)',
                                            }}
                                        >
                                            <NavIcon d={item.icon} />
                                            {!collapsed ? <span>{item.label}</span> : null}
                                        </Link>

                                        {/* Interactive hover info popover (appears to the right). */}
                                        <div
                                            className={`absolute left-full top-0 ml-3 z-[60] w-56 p-3 rounded-xl transition-all duration-200 origin-left ${
                                                hovered === item.href ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                                            }`}
                                            style={{ background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', boxShadow: '0 8px 30px rgba(16,24,40,0.16), 0 2px 8px rgba(16,24,40,0.10)' }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span style={{ color: 'var(--ui-primary)' }}><NavIcon d={item.icon} /></span>
                                                <span className="font-semibold text-sm" style={{ color: 'var(--ui-text)' }}>{item.label}</span>
                                            </div>
                                            <p className="ui-muted text-xs leading-relaxed">{item.desc}</p>
                                            <Link href={item.href} className="inline-block mt-2 text-xs font-medium" style={{ color: 'var(--ui-primary)' }}>Open →</Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                <button onClick={toggleCollapsed} title={collapsed ? 'Expand' : 'Collapse'} className={`flex items-center py-3 border-t ui-border ui-muted hover:opacity-80 text-sm shrink-0 ${collapsed ? 'justify-center px-0' : 'gap-2 px-4'}`}>
                    <svg viewBox="0 0 24 24" fill="none" className={`size-5 stroke-current transition-transform ${collapsed ? 'rotate-180' : ''}`} strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    {!collapsed ? <span>Collapse</span> : null}
                </button>
            </aside>

            {/* Main column */}
            <div className="flex flex-col grow min-w-0 gap-4">
                {/* Floating topbar — rounded card, floats below the viewport top. */}
                <header className="ui-float h-16 flex items-center gap-3 px-5 sticky top-4 z-30 shrink-0">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/admin" className="ui-muted hover:opacity-80">Dashboard</Link>
                        {active && active.href !== '/admin' ? (
                            <>
                                <span className="ui-muted">/</span>
                                <span style={{ color: 'var(--ui-text)' }} className="font-medium">{active.label}</span>
                            </>
                        ) : null}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        <Link href="/admin/notifications" className="relative ui-btn ui-btn-ghost !px-2" title="Notifications" aria-label="Notifications">
                            <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-current" strokeWidth={1.7}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            {unread > 0 ? (
                                <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[0.65rem] font-bold flex items-center justify-center text-white" style={{ background: 'var(--ui-danger)' }}>
                                    {unread > 99 ? '99+' : unread}
                                </span>
                            ) : null}
                        </Link>
                        <ThemeToggle />
                        <Link href="/" className="ui-btn ui-btn-ghost text-sm">View store</Link>
                    </div>
                </header>

                <main className="grow">{children}</main>
            </div>
        </div>
    )
}

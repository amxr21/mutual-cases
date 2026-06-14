'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Client-side admin gate for the dashboard. Checks the stored role for a fast
 * UX decision; the real enforcement is server-side (requireAdmin on /admin/*),
 * so even if someone bypasses this, the API returns 403.
 */
const NAV = [
    { href: '/admin', label: 'Overview', exact: true },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/custom-requests', label: 'Custom Requests' },
    { href: '/admin/customers', label: 'Customers' },
]

export default function AdminGuard({ children }) {
    const pathname = usePathname()
    const [state, setState] = useState('checking') // checking | ok | denied

    useEffect(() => {
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        setState(token && role === 'admin' ? 'ok' : 'denied')
    }, [])

    if (state === 'checking') {
        return <div className="min-h-screen flex items-center justify-center font-light">Checking access…</div>
    }

    if (state === 'denied') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
                <p className="text-6xl">🔒</p>
                <h1 className="text-2xl font-semibold">Admin access required</h1>
                <p className="font-light text-off-black/70">You need to be signed in as an administrator to view this page.</p>
                <Link href="/" className="bg-blue text-off-white font-semibold px-6 py-3 rounded-lg transition hover:brightness-110">
                    Back to store
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col xl:flex-row bg-[#f4f6fb]">
            {/* Sidebar */}
            <aside className="xl:w-64 bg-blue text-off-white flex xl:flex-col gap-1 p-4 xl:p-6 xl:min-h-screen overflow-x-auto">
                <Link href="/" className="hidden xl:block text-2xl font-bold mb-6">Mutual<span className="text-gold">.</span></Link>
                {NAV.map((item) => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-colors ${
                                active ? 'bg-off-white text-blue font-semibold' : 'hover:bg-white/10'
                            }`}
                        >
                            {item.label}
                        </Link>
                    )
                })}
                <Link href="/" className="xl:mt-auto px-4 py-2.5 rounded-lg whitespace-nowrap hover:bg-white/10 transition-colors text-sm">
                    ← Back to store
                </Link>
            </aside>

            {/* Content */}
            <main className="grow p-5 xl:p-10 overflow-x-hidden">{children}</main>
        </div>
    )
}

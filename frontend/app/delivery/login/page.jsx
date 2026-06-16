'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { postJSON } from '../../lib/safeFetch'
import { useToast } from '../../components/Toast/ToastProvider'

/**
 * Delivery-portal login. Drivers (created by admin, no Google account) sign in
 * with the access code their admin gave them. On success we store a delivery-
 * scoped session and route to the deliveries list.
 */
export default function DeliveryLogin() {
    const router = useRouter()
    const toast = useToast()
    const [code, setCode] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        if (!code.trim()) { toast.error('Enter your access code'); return }
        setBusy(true)
        const r = await postJSON('/delivery/auth', { access_code: code.trim().toUpperCase() })
        setBusy(false)
        if (!r.ok || !r.data?.token) { toast.error(r.error?.message || 'Invalid access code'); return }
        try {
            localStorage.setItem('delivery_token', r.data.token)
            localStorage.setItem('delivery_name', r.data.name || '')
            localStorage.setItem('delivery_userId', String(r.data.userId))
        } catch { /* ignore */ }
        // The portal shows an inline welcome banner, so no toast here.
        router.push('/delivery')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f6f7f9' }}>
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-black/5 p-8 flex flex-col gap-5">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#055AB0' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="size-6 stroke-white" strokeWidth={1.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Delivery Portal</h1>
                    <p className="text-sm text-gray-500">Enter the access code from your admin to view your deliveries.</p>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ACCESS CODE"
                        autoCapitalize="characters"
                        className="w-full text-center font-mono tracking-[0.3em] text-lg border border-gray-300 rounded-lg py-3 px-3 outline-none focus:border-blue-600"
                    />
                    <button type="submit" disabled={busy} className="w-full text-white font-semibold py-3 rounded-lg transition-all hover:brightness-110 disabled:opacity-60" style={{ background: '#055AB0' }}>
                        {busy ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeFetch } from '../lib/safeFetch'
import { useToast } from '../components/Toast/ToastProvider'

/**
 * Delivery portal — a driver sees ONLY their assigned orders and advances each
 * through the delivery sub-lifecycle. Also shows the driver's own profile and
 * lets them set their availability. Uses the delivery-scoped token (separate
 * from the customer/admin token). Admin coordinates; the driver executes.
 */
const FLOW = ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'handed_over']
const LABEL = { assigned: 'Assigned', picked_up: 'Picked up', out_for_delivery: 'Out for delivery', delivered: 'Delivered', handed_over: 'Handed over' }
const NEXT_ACTION = { assigned: 'Pick up', picked_up: 'Start delivery', out_for_delivery: 'Mark delivered', delivered: 'Confirm handover' }
const AVAIL = [
    { value: 'active', label: 'Ready', tone: '#16a34a' },
    { value: 'on_shift', label: 'On shift', tone: '#055AB0' },
]

function deliveryAuthHeader() {
    const t = typeof window !== 'undefined' ? localStorage.getItem('delivery_token') : null
    return t ? { Authorization: `Bearer ${t}` } : {}
}
const dGet = (path) => safeFetch(path, { method: 'GET', headers: deliveryAuthHeader() })
const dPatch = (path, body) => safeFetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...deliveryAuthHeader() }, body: JSON.stringify(body) })

export default function DeliveryPortal() {
    const router = useRouter()
    const toast = useToast()
    const [me, setMe] = useState(null)
    const [orders, setOrders] = useState([])
    const [status, setStatus] = useState('loading') // loading | ready | error
    const [busyId, setBusyId] = useState(null)
    const [noteFor, setNoteFor] = useState(null)
    const [note, setNote] = useState('')
    const [savingAvail, setSavingAvail] = useState(false)
    const [showWelcome, setShowWelcome] = useState(true)

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('delivery_token') : null
        if (!token) { router.replace('/delivery/login'); return }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const load = async () => {
        setStatus('loading')
        const [profile, list] = await Promise.all([dGet('/delivery/me'), dGet('/delivery/orders')])
        if ((profile.status === 401 || profile.status === 403) || (list.status === 401 || list.status === 403)) {
            // Inactive/blocked or expired session → back to login.
            logout()
            return
        }
        if (profile.ok && profile.data) setMe(profile.data)
        if (list.ok && Array.isArray(list.data)) { setOrders(list.data); setStatus('ready') }
        else setStatus('error')
    }

    const logout = () => {
        ['delivery_token', 'delivery_name', 'delivery_userId'].forEach((k) => localStorage.removeItem(k))
        router.replace('/delivery/login')
    }

    const setAvailability = async (val) => {
        if (savingAvail || me?.status === val) return
        setSavingAvail(true)
        const r = await dPatch('/delivery/me/status', { status: val })
        setSavingAvail(false)
        if (!r.ok) { toast.error(r.error?.message || 'Failed to update'); return }
        setMe((m) => m ? { ...m, status: val } : m)
        toast.success(`You're now ${val === 'active' ? 'Ready' : 'On shift'}`)
    }

    const advance = async (order, withNote) => {
        const idx = FLOW.indexOf(order.delivery_status)
        const next = FLOW[idx + 1]
        if (!next) return
        setBusyId(order.order_number)
        const r = await dPatch(`/delivery/orders/${order.order_number}/status`, { delivery_status: next, note: withNote || '' })
        setBusyId(null)
        if (!r.ok) { toast.error(r.error?.message || 'Update failed'); return }
        toast.success(`Marked: ${LABEL[next]}`)
        setNoteFor(null); setNote('')
        setOrders((prev) => prev.map((o) => o.order_number === order.order_number ? { ...o, delivery_status: next } : o))
    }

    const firstName = me?.name ? String(me.name).split(' ')[0] : ''

    if (status === 'loading') return <Shell me={me} onLogout={logout}><p className="text-gray-500">Loading…</p></Shell>
    if (status === 'error') return <Shell me={me} onLogout={logout}><p className="text-red-600">Couldn&apos;t load your deliveries.</p></Shell>

    const active = orders.filter((o) => o.delivery_status !== 'handed_over')
    const done = orders.filter((o) => o.delivery_status === 'handed_over')

    return (
        <Shell me={me} onLogout={logout}>
            {/* Inline welcome banner (dismissible) — replaces the login toast. */}
            {showWelcome ? (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(5,90,176,0.06)', border: '1px solid rgba(5,90,176,0.15)' }}>
                    <svg viewBox="0 0 24 24" fill="none" className="size-5 stroke-blue-700 shrink-0 mt-0.5" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <div className="grow text-sm">
                        <span className="font-semibold text-gray-900">Welcome back{firstName ? `, ${firstName}` : ''}!</span>
                        <span className="text-gray-600"> You have {active.length} active deliver{active.length === 1 ? 'y' : 'ies'} today.</span>
                    </div>
                    <button onClick={() => setShowWelcome(false)} aria-label="Dismiss" className="text-gray-400 hover:text-gray-700 shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ) : null}

            {/* Profile card */}
            {me ? <ProfileCard me={me} onSetAvailability={setAvailability} saving={savingAvail} /> : null}

            {/* Orders */}
            {orders.length === 0 ? (
                <div className="text-center text-gray-500 py-16">No deliveries assigned to you yet.</div>
            ) : (
                <div className="flex flex-col gap-6 mt-6">
                    <Section title={`Active (${active.length})`}>
                        {active.length === 0 ? <p className="text-gray-400 text-sm">Nothing active right now.</p> : active.map((o) => (
                            <DeliveryCard key={o.order_number} o={o} busy={busyId === o.order_number}
                                onAdvance={() => {
                                    const next = FLOW[FLOW.indexOf(o.delivery_status) + 1]
                                    if (next === 'delivered' || next === 'handed_over') { setNoteFor(o.order_number); setNote('') }
                                    else advance(o)
                                }}
                                noteOpen={noteFor === o.order_number}
                                note={note} setNote={setNote}
                                onConfirmNote={() => advance(o, note)}
                                onCancelNote={() => { setNoteFor(null); setNote('') }}
                            />
                        ))}
                    </Section>

                    {done.length ? (
                        <Section title={`Previous (${done.length})`}>
                            {done.map((o) => <DeliveryCard key={o.order_number} o={o} completed />)}
                        </Section>
                    ) : null}
                </div>
            )}
        </Shell>
    )
}

function Shell({ me, onLogout, children }) {
    const tone = me?.status === 'active' ? '#16a34a' : me?.status === 'on_shift' ? '#055AB0' : '#9ca3af'
    return (
        <div className="min-h-screen" style={{ background: '#f6f7f9' }}>
            <header className="bg-white border-b border-black/5 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <span className="font-bold" style={{ color: '#055AB0' }}>Delivery Portal</span>
                    <div className="flex items-center gap-3">
                        {me ? (
                            <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                <span className="w-2 h-2 rounded-full" style={{ background: tone }} />
                                {me.name}
                            </span>
                        ) : null}
                        <button onClick={onLogout} className="text-sm font-medium text-gray-500 hover:text-gray-800">Sign out</button>
                    </div>
                </div>
            </header>
            <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
        </div>
    )
}

function ProfileCard({ me, onSetAvailability, saving }) {
    const coverage = [me.zone, me.emirate, me.country].filter(Boolean).join(', ')
    return (
        <div className="bg-white rounded-xl shadow-sm border border-black/5 p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: '#055AB0' }}>
                    {(me.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="grow">
                    <div className="font-semibold text-gray-900">{me.name}</div>
                    <div className="text-xs text-gray-500">{me.email}{me.phone ? ` · ${me.phone}` : ''}</div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{me.activeCount}</div>
                    <div className="text-[0.65rem] uppercase tracking-wide text-gray-400">active</div>
                </div>
            </div>

            {/* Availability selector */}
            <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Your availability</div>
                <div className="flex gap-2">
                    {AVAIL.map((a) => {
                        const on = me.status === a.value
                        return (
                            <button key={a.value} onClick={() => onSetAvailability(a.value)} disabled={saving}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                                style={on ? { background: a.tone, color: '#fff' } : { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                                {a.label}
                            </button>
                        )
                    })}
                </div>
                {me.status === 'inactive' ? <p className="text-xs text-red-600 mt-1.5">Your account was set inactive by admin.</p> : null}
            </div>

            {/* Registered details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-black/5 pt-3">
                <Detail label="Vehicle" value={me.vehicle_type} />
                <Detail label="Plate" value={me.plate_number} />
                <Detail label="License" value={me.license_number} />
                <Detail label="Coverage" value={coverage} />
            </div>
        </div>
    )
}

function Detail({ label, value }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-gray-800">{value || '—'}</span>
        </div>
    )
}

function Section({ title, children }) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h2>
            {children}
        </div>
    )
}

const STEP_TONE = { assigned: '#6b7280', picked_up: '#055AB0', out_for_delivery: '#055AB0', delivered: '#16a34a', handed_over: '#16a34a' }

function DeliveryCard({ o, busy, onAdvance, completed, noteOpen, note, setNote, onConfirmNote, onCancelNote }) {
    const addr = [o.address, o.area, o.city, o.country].filter(Boolean).join(', ')
    const nextLabel = NEXT_ACTION[o.delivery_status]
    return (
        <div className="bg-white rounded-xl shadow-sm border border-black/5 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{o.order_number}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: STEP_TONE[o.delivery_status] }}>{LABEL[o.delivery_status]}</span>
            </div>
            <div className="text-sm text-gray-600 flex flex-col gap-1">
                <div><span className="text-gray-400">Customer:</span> {o.customer_name || 'Guest'}{o.customer_phone ? <> · <a href={`tel:${o.customer_phone}`} className="text-blue-700">{o.customer_phone}</a></> : null}</div>
                <div><span className="text-gray-400">Address:</span> {addr || '—'}</div>
                <div><span className="text-gray-400">Total:</span> {o.total} AED · {o.payment_method === 'cod' ? 'Cash on delivery' : o.payment_method}</div>
                {o.delivery_note ? <div><span className="text-gray-400">Note:</span> {o.delivery_note}</div> : null}
            </div>

            {!completed && nextLabel ? (
                noteOpen ? (
                    <div className="flex flex-col gap-2 border-t border-black/5 pt-3">
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note / proof (optional)" className="w-full border border-gray-300 rounded-lg py-2 px-3 outline-none focus:border-blue-600 text-sm" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={onCancelNote} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                            <button onClick={onConfirmNote} disabled={busy} className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: '#16a34a' }}>{busy ? '…' : 'Confirm'}</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={onAdvance} disabled={busy} className="w-full py-2.5 rounded-lg font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60" style={{ background: '#055AB0' }}>
                        {busy ? '…' : nextLabel}
                    </button>
                )
            ) : null}
        </div>
    )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../Context/CartContext'
import { useToast } from './Toast/ToastProvider'
import { getJSON, postJSON } from '../lib/safeFetch'
import SmoothSelect from './SmoothSelect'
import { GCC_COUNTRIES, citiesFor } from '../constants/gcc'

/**
 * Checkout: shipping address form with validation + live order summary
 * (items, note, gift) + a clearly-marked payment placeholder. On submit it
 * creates the order in the backend and routes to the success page.
 *
 * Country and City are a dependent relationship: choosing a (GCC) country
 * filters the available cities; an "Other" city option reveals a free-text
 * field so unlisted cities still work.
 */
const REQUIRED = ['country', 'city', 'area']

export default function CheckoutForm() {
    const router = useRouter()
    const toast = useToast()
    const { items, requests, totals, clearCart } = useCart()

    const [form, setForm] = useState({ country: 'United Arab Emirates', city: '', area: '', address: '' })
    const [cityChoice, setCityChoice] = useState('') // the selected dropdown value ('' | a city | 'Other')
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [payment, setPayment] = useState('cod') // 'cod' | 'card_on_delivery'
    const [geoEnabled, setGeoEnabled] = useState(false)
    const [locating, setLocating] = useState(false)

    // Whether autodetect is enabled is an admin setting; default off.
    useEffect(() => {
        ;(async () => {
            const r = await getJSON('/settings/public')
            if (r.ok && r.data) setGeoEnabled(!!r.data.locationAutodetect)
        })()
    }, [])

    const setField = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }))
        setErrors((er) => ({ ...er, [k]: undefined }))
    }

    // Country change resets the city (the old city may not exist in the new country).
    const onCountry = (country) => {
        setForm((f) => ({ ...f, country, city: '' }))
        setCityChoice('')
        setErrors((er) => ({ ...er, country: undefined, city: undefined }))
    }

    // City dropdown: a real city sets form.city directly; 'Other' clears it so
    // the free-text input takes over.
    const onCity = (choice) => {
        setCityChoice(choice)
        setForm((f) => ({ ...f, city: choice === 'Other' ? '' : choice }))
        setErrors((er) => ({ ...er, city: undefined }))
    }

    // Browser geolocation -> reverse geocode -> prefill country/city/area.
    // Only available when the admin has enabled autodetect.
    const detectLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation is not supported on this device'); return }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`, { headers: { Accept: 'application/json' } })
                    const data = await res.json()
                    const a = data.address || {}
                    const country = a.country || ''
                    const city = a.city || a.town || a.state || ''
                    const area = a.suburb || a.neighbourhood || a.county || ''
                    const matchedCountry = GCC_COUNTRIES.find((c) => c.toLowerCase() === country.toLowerCase()) || country
                    setForm((f) => ({ ...f, country: matchedCountry || f.country, city: city || f.city, area: area || f.area }))
                    setCityChoice(citiesFor(matchedCountry).includes(city) ? city : (city ? 'Other' : ''))
                    toast.success('Location detected')
                } catch {
                    toast.error("Couldn't detect your location")
                } finally {
                    setLocating(false)
                }
            },
            () => { setLocating(false); toast.error('Location permission denied') },
            { timeout: 10000 }
        )
    }

    const validate = () => {
        const next = {}
        for (const k of REQUIRED) {
            if (!form[k] || !form[k].trim()) next[k] = 'This field is required'
        }
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const placeOrder = async () => {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!userId) {
            toast.info('Please log in to place your order')
            return
        }
        if (items.length === 0) {
            toast.error('Your cart is empty')
            return
        }
        if (!validate()) {
            toast.error('Please complete the required address fields')
            return
        }

        setSubmitting(true)
        const result = await postJSON('/orders', {
            user_id: userId,
            address: form,
            items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
            note: requests.note,
            gift: requests.gift,
            payment_method: payment,
        })
        setSubmitting(false)

        if (!result.ok || !result.data?.orderNumber) {
            toast.error(result.error?.message || "Couldn't place your order. Please try again.")
            return
        }

        // Order confirmed — clear the cart locally so the UI/badge update
        // immediately (the backend already cleared cart_items server-side).
        clearCart()
        toast.success('Order placed!')
        router.push(`/order-success?order=${encodeURIComponent(result.data.orderNumber)}`)
    }

    const inputClass = (k) =>
        `w-full bg-off-white border rounded-md py-2.5 px-3 outline-none transition-colors ${
            errors[k] ? 'border-gold' : 'border-gray-300 focus:border-blue'
        }`

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6 xl:gap-10">
            {/* Address form */}
            <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold">Shipping Address</h2>
                    {geoEnabled ? (
                        <button
                            type="button"
                            onClick={detectLocation}
                            disabled={locating}
                            className="flex items-center gap-2 text-sm font-medium text-blue border border-blue/30 rounded-lg px-3 py-1.5 transition-colors hover:bg-blue/5 disabled:opacity-60"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="size-4 stroke-current" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {locating ? 'Detecting…' : 'Use my location'}
                        </button>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="font-medium">Country <span className="text-gold">*</span></span>
                        <SmoothSelect value={form.country} onChange={onCountry} options={GCC_COUNTRIES} placeholder="Select country" />
                        {errors.country ? <span className="text-gold text-sm">{errors.country}</span> : null}
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="font-medium">City <span className="text-gold">*</span></span>
                        <SmoothSelect value={cityChoice} onChange={onCity} options={citiesFor(form.country)} placeholder="Select city" />
                        {/* 'Other' city -> free-text input. */}
                        {cityChoice === 'Other' ? (
                            <input value={form.city} onChange={setField('city')} placeholder="Enter your city" className={`${inputClass('city')} mt-1`} />
                        ) : null}
                        {errors.city ? <span className="text-gold text-sm">{errors.city}</span> : null}
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="font-medium">Area <span className="text-gold">*</span></span>
                        <input value={form.area} onChange={setField('area')} placeholder="e.g. Al Reem Island" className={inputClass('area')} />
                        {errors.area ? <span className="text-gold text-sm">{errors.area}</span> : null}
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="font-medium">Street / Building</span>
                        <input value={form.address} onChange={setField('address')} placeholder="Optional details" className={inputClass('address')} />
                    </label>
                </div>

                {/* Payment methods */}
                <div className="mt-2 flex flex-col gap-3">
                    <h3 className="text-lg font-semibold">Payment</h3>

                    {/* Working: cash / card on delivery */}
                    {[
                        { id: 'cod', title: 'Cash on Delivery', desc: 'Pay with cash when your order arrives.' },
                        { id: 'card_on_delivery', title: 'Card on Delivery', desc: 'Pay by card to the courier on arrival.' },
                    ].map((m) => {
                        const active = payment === m.id
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setPayment(m.id)}
                                className={`flex items-start gap-3 text-left rounded-lg border p-4 transition-all duration-200 cursor-pointer
                                    ${active ? 'border-blue bg-blue/5 ring-2 ring-blue/15' : 'border-gray-300 hover:border-blue/50'}`}
                            >
                                <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-blue' : 'border-gray-400'}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full bg-blue transition-transform duration-200 ${active ? 'scale-100' : 'scale-0'}`} />
                                </span>
                                <span className="flex flex-col">
                                    <span className="font-semibold">{m.title}</span>
                                    <span className="text-sm text-off-black/60">{m.desc}</span>
                                </span>
                            </button>
                        )
                    })}

                    {/* Online payment — placeholder, not yet wired */}
                    <div className="rounded-lg border border-dashed border-gray-300 p-4 opacity-60">
                        <p className="text-sm font-medium mb-2">Online payment (coming soon)</p>
                        <div className="grid grid-cols-2 gap-3 pointer-events-none">
                            <div className="border border-gray-300 rounded-lg py-2.5 text-center text-sm font-medium">Card</div>
                            <div className="border border-gray-300 rounded-lg py-2.5 text-center text-sm font-medium">Apple / Google Pay</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order summary */}
            <div className="bg-off-white rounded-2xl shadow-lg p-6 xl:p-8 flex flex-col gap-4 h-fit">
                <h2 className="text-2xl font-semibold">Order Summary</h2>

                <div className="flex flex-col gap-3 max-h-72 overflow-auto pr-1">
                    {items.map((it) => (
                        <div key={it.product_id} className="flex justify-between gap-3 text-sm">
                            <span className="font-light capitalize">
                                {it.category} {it.model} <span className="opacity-60">×{it.quantity}</span>
                            </span>
                            <span className="font-semibold whitespace-nowrap">{Number(it.price) * Number(it.quantity)} AED</span>
                        </div>
                    ))}
                    {items.length === 0 ? <p className="font-light">Your cart is empty.</p> : null}
                </div>

                {requests.gift ? (
                    <div className="text-sm bg-blue/5 rounded-md px-3 py-2">🎁 Gift wrapping</div>
                ) : null}
                {requests.note ? (
                    <div className="text-sm bg-blue/5 rounded-md px-3 py-2">📝 Note: {requests.note}</div>
                ) : null}

                <div className="flex justify-between text-xl font-semibold border-t pt-3">
                    <span>Total</span>
                    <span>{totals.price} AED</span>
                </div>

                <button
                    type="button"
                    onClick={placeOrder}
                    disabled={submitting || items.length === 0}
                    className="w-full bg-blue text-off-white text-lg font-semibold py-3 rounded-lg transition-all duration-300 hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                >
                    {submitting ? 'Placing order…' : 'Place Order'}
                </button>
            </div>
        </div>
    )
}

'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getJSON } from '../../../../lib/safeFetch'

/**
 * Printable VAT invoice + packing slip for one order. Standalone (no admin
 * chrome) so it prints cleanly. UAE-compliant: shows the store TRN and a tax
 * line backed out of the VAT-inclusive total. Toggle to a packing slip (no
 * prices) for the courier.
 */
export default function InvoicePage() {
    const { orderNumber } = useParams()
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')
    const [mode, setMode] = useState('invoice') // 'invoice' | 'packing'

    useEffect(() => {
        ;(async () => {
            const r = await getJSON(`/admin/orders/${orderNumber}/invoice`)
            if (r.ok && r.data?.order) { setData(r.data); setStatus('ready') }
            else setStatus('error')
        })()
    }, [orderNumber])

    if (status === 'loading') return <div className="p-10 text-gray-500">Loading…</div>
    if (status === 'error') return <div className="p-10 text-red-600">Couldn&apos;t load the invoice.</div>

    const { order, customer, address, items, store, totals } = data
    const money = (n) => `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${totals.currency}`
    const isPacking = mode === 'packing'
    const addrLine = address ? [address.address, address.area, address.city, address.country].filter(Boolean).join(', ') : '—'

    return (
        <div style={{ background: '#fff', color: '#111', minHeight: '100vh' }}>
            {/* Toolbar (hidden when printing) */}
            <div className="no-print" style={{ display: 'flex', gap: 8, padding: 16, borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <button onClick={() => setMode('invoice')} style={tabStyle(!isPacking)}>Invoice</button>
                <button onClick={() => setMode('packing')} style={tabStyle(isPacking)}>Packing slip</button>
                <button onClick={() => window.print()} style={{ marginLeft: 'auto', background: '#055AB0', color: '#fff', border: 0, borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Print</button>
            </div>

            {/* Document */}
            <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 40px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {store.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={store.logoUrl} alt={store.name} style={{ width: 56, height: 56, objectFit: 'contain' }} />
                        ) : null}
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#055AB0' }}>{store.name}</div>
                            {store.trn ? <div style={{ fontSize: 12, color: '#555' }}>TRN: {store.trn}</div> : null}
                            {store.email ? <div style={{ fontSize: 12, color: '#555' }}>{store.email}</div> : null}
                            {store.phone ? <div style={{ fontSize: 12, color: '#555' }}>{store.phone}</div> : null}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{isPacking ? 'Packing Slip' : 'Tax Invoice'}</div>
                        <div style={{ fontSize: 13, color: '#333', marginTop: 4 }}>{order.order_number}</div>
                        <div style={{ fontSize: 12, color: '#777' }}>{new Date(order.order_date).toLocaleString()}</div>
                    </div>
                </div>

                {/* Parties */}
                <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Bill to</div>
                        <div style={{ fontWeight: 600 }}>{customer.name || 'Guest'}</div>
                        {customer.email ? <div style={subStyle}>{customer.email}</div> : null}
                        {customer.phone ? <div style={subStyle}>{customer.phone}</div> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Ship to</div>
                        <div style={subStyle}>{addrLine}</div>
                        {order.carrier ? <div style={subStyle}>Carrier: {order.carrier}</div> : null}
                        {order.tracking_number ? <div style={subStyle}>Tracking: {order.tracking_number}</div> : null}
                    </div>
                </div>

                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            <th style={thStyle}>Item</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Qty</th>
                            {!isPacking ? <th style={{ ...thStyle, textAlign: 'right' }}>Unit</th> : null}
                            {!isPacking ? <th style={{ ...thStyle, textAlign: 'right' }}>Total</th> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => (
                            <tr key={i}>
                                <td style={tdStyle}>
                                    <span style={{ textTransform: 'capitalize' }}>{it.category} {it.model}</span>
                                    <span style={{ color: '#888' }}> · {it.edition ? `${it.edition} · ` : ''}{it.type}</span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{it.quantity}</td>
                                {!isPacking ? <td style={{ ...tdStyle, textAlign: 'right' }}>{money(it.price)}</td> : null}
                                {!isPacking ? <td style={{ ...tdStyle, textAlign: 'right' }}>{money(it.lineTotal)}</td> : null}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals (invoice only) */}
                {!isPacking ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <table style={{ fontSize: 14, minWidth: 260 }}>
                            <tbody>
                                {totals.vatEnabled ? (
                                    <>
                                        <tr><td style={totLabel}>Subtotal (excl. VAT)</td><td style={totVal}>{money(totals.net)}</td></tr>
                                        <tr><td style={totLabel}>VAT ({totals.vatRate}%{totals.vatInclusive ? ', incl.' : ''})</td><td style={totVal}>{money(totals.tax)}</td></tr>
                                    </>
                                ) : null}
                                <tr><td style={{ ...totLabel, fontWeight: 700, fontSize: 16, paddingTop: 8 }}>Total</td><td style={{ ...totVal, fontWeight: 700, fontSize: 16, paddingTop: 8 }}>{money(totals.grand)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {/* Footer */}
                <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #eee', fontSize: 11, color: '#999', textAlign: 'center' }}>
                    {isPacking ? 'Packing slip — not a tax document.' : `This is a VAT-compliant tax invoice.${store.trn ? ` TRN ${store.trn}.` : ''} Payment: ${order.payment_method}.`}
                </div>
            </div>

            <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } }`}</style>
        </div>
    )
}

const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#999', marginBottom: 4 }
const subStyle = { fontSize: 13, color: '#444' }
const thStyle = { textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: '#555', borderBottom: '1px solid #e5e7eb' }
const tdStyle = { padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }
const totLabel = { padding: '4px 12px 4px 0', color: '#555', textAlign: 'left' }
const totVal = { padding: '4px 0', textAlign: 'right', fontWeight: 600 }
const tabStyle = (active) => ({ background: active ? '#055AB0' : 'transparent', color: active ? '#fff' : '#333', border: active ? 0 : '1px solid #ddd', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' })

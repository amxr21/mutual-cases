'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getJSON } from '../../lib/safeFetch'
import { publicConfig } from '../../lib/config'
import { PageHeader, StatCard } from '../ui/primitives'
import AdminMessage from '../ui/AdminMessage'
import Loader from '../ui/Loader'
import DataTable from '../ui/DataTable'
import Select from '../ui/Select'

// Grouped reports. `detail: true` = row-level (every record); else aggregated.
const REPORTS = [
    { key: 'orders-detail', label: 'Orders (detailed)', group: 'Detailed', detail: true },
    { key: 'returns-detail', label: 'Returns (detailed)', group: 'Detailed', detail: true },
    { key: 'inventory-detail', label: 'Inventory (detailed)', group: 'Detailed', detail: true, ranged: false },
    { key: 'stock-log', label: 'Stock adjustment log', group: 'Detailed', detail: true },
    { key: 'custom-requests', label: 'Custom requests', group: 'Detailed', detail: true },
    { key: 'reviews-detail', label: 'Reviews', group: 'Detailed', detail: true },
    { key: 'sales', label: 'Sales by day', group: 'Summary' },
    { key: 'products', label: 'Products', group: 'Summary' },
    { key: 'customers', label: 'Customers', group: 'Summary' },
    { key: 'vat', label: 'VAT', group: 'Summary' },
    { key: 'discounts', label: 'Discounts', group: 'Summary', ranged: false },
]
const META = Object.fromEntries(REPORTS.map((r) => [r.key, r]))
const isRanged = (k) => META[k]?.ranged !== false

export default function AdminReports() {
    const params = useSearchParams()
    const [report, setReport] = useState(params.get('report') && META[params.get('report')] ? params.get('report') : 'orders-detail')
    const [from, setFrom] = useState(params.get('from') || '')
    const [to, setTo] = useState(params.get('to') || '')
    const [rows, setRows] = useState([])
    const [summary, setSummary] = useState(null)
    const [status, setStatus] = useState('loading')

    const qs = useCallback(() => {
        const p = new URLSearchParams()
        if (isRanged(report)) { if (from) p.set('from', from); if (to) p.set('to', to) }
        const s = p.toString()
        return s ? `?${s}` : ''
    }, [report, from, to])

    const load = useCallback(async () => {
        setStatus('loading')
        const dp = new URLSearchParams()
        if (from) dp.set('from', from); if (to) dp.set('to', to)
        const dqs = dp.toString() ? `?${dp.toString()}` : ''
        const [r, s] = await Promise.all([
            getJSON(`/admin/reports/${report}${qs()}`),
            getJSON(`/admin/reports/summary${dqs}`),
        ])
        if (s.ok) setSummary(s.data)
        if (r.ok && Array.isArray(r.data)) { setRows(r.data); setStatus('ready') }
        else setStatus('error')
    }, [report, qs, from, to])

    useEffect(() => { load() }, [load])

    const downloadCsv = async () => {
        const sep = qs() ? '&' : '?'
        const url = `${publicConfig.apiBaseUrl}/admin/reports/${report}${qs()}${sep}format=csv`
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!res.ok) return
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${report}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
    }

    const columns = rows.length ? Object.keys(rows[0]).map((k) => ({
        key: k,
        header: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        sortable: true,
        render: (row) => formatCell(report, k, row[k]),
    })) : []

    const reportOptions = REPORTS.map((r) => ({ label: `${r.group === 'Detailed' ? '📋 ' : '📊 '}${r.label}`, value: r.key }))
    const current = META[report]

    return (
        <div>
            <PageHeader title="Reports" subtitle="Detailed records and summaries — filter, export, and print" />

            {summary ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4 no-print">
                    <StatCard label="Revenue" value={`${Number(summary.revenue).toLocaleString()} AED`} tone="gold" sub={`${summary.orders} realized orders`} />
                    <StatCard label="Avg order value" value={`${Number(summary.aov).toLocaleString()} AED`} sub={`${summary.buyers} buyers`} />
                    <StatCard label="Refund rate" value={`${summary.refundRate}%`} sub={`${summary.refunds} returns · ${Number(summary.refundAmount).toLocaleString()} AED`} />
                    <StatCard label="Top category" value={summary.topCategory ? summary.topCategory : '—'} sub={`${summary.totalOrders} orders all statuses`} />
                </div>
            ) : null}

            <div className="ui-surface p-4 mb-4 flex flex-wrap items-end gap-3 no-print">
                <div className="flex flex-col gap-1">
                    <label className="ui-muted text-xs font-semibold uppercase">Report</label>
                    <Select value={report} onChange={setReport} options={reportOptions} className="w-60" />
                </div>
                {isRanged(report) ? (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="ui-muted text-xs font-semibold uppercase">From</label>
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ui-input" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="ui-muted text-xs font-semibold uppercase">To</label>
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ui-input" />
                        </div>
                        <button className="ui-btn ui-btn-ghost" onClick={() => { setFrom(''); setTo('') }}>Clear</button>
                    </>
                ) : null}
                <div className="ml-auto flex gap-2">
                    <button className="ui-btn ui-btn-ghost" onClick={() => window.print()} disabled={!rows.length}>Print</button>
                    <button className="ui-btn ui-btn-primary" onClick={downloadCsv} disabled={!rows.length}>Export CSV</button>
                </div>
            </div>

            {/* Print header (only visible when printing) */}
            <div className="print-only mb-3">
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{current?.label}</h2>
                <p style={{ fontSize: 12, color: '#666' }}>
                    {from || to ? `${from || '…'} → ${to || '…'}` : 'All time'} · {rows.length} records · generated {new Date().toLocaleString()}
                </p>
            </div>

            {status === 'loading' ? <Loader rows={8} /> : null}
            {status === 'error' ? <AdminMessage variant="error" title="Couldn't load this report" message="Please refresh to try again." /> : null}
            {status === 'ready' ? (
                <DataTable columns={columns} rows={rows} searchPlaceholder="Search records…" emptyText="No records for this selection." pageSize={50} />
            ) : null}
        </div>
    )
}

const MONEY_KEYS = /revenue|spend|amount|net|vat|gross|grand|price|total|refund|aov|min_spend|discount/
const DATE_KEYS = /date|created_at|resolved_at|first_order|last_order/

function formatCell(report, key, value) {
    if (value == null) return '—'
    if (key === 'value' && /discount/.test(report)) return String(value) // discount % vs AED — leave raw
    if (MONEY_KEYS.test(key) && !isNaN(Number(value))) {
        return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} AED`
    }
    if (DATE_KEYS.test(key) && !isNaN(Date.parse(value))) {
        const d = new Date(value)
        // include time for detailed timestamps
        return /created_at|resolved_at|date/.test(key) && String(value).includes('T')
            ? d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
            : d.toLocaleDateString()
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
}

'use client'
import { useMemo, useState } from 'react'

/**
 * Generic admin data table: client-side search, column sort, and pagination.
 * Reusable across resources by passing a `columns` config.
 *
 * columns: [{ key, header, sortable?, render?(row), accessor?(row), align? }]
 * rows: array of objects
 * searchKeys: which fields the search box matches against (defaults to all string-ish)
 * rowActions(row): optional node rendered in a trailing actions column
 */
export default function DataTable({
    columns,
    rows = [],
    searchKeys,
    searchPlaceholder = 'Search…',
    pageSize = 30,
    rowKey = (r, i) => r.id ?? i,
    rowActions,
    emptyText = 'No records found.',
    toolbar,
}) {
    const [q, setQ] = useState('')
    const [sort, setSort] = useState({ key: null, dir: 'asc' })
    const [page, setPage] = useState(1)

    const valueOf = (row, col) =>
        col.accessor ? col.accessor(row) : row[col.key]

    const filtered = useMemo(() => {
        if (!q.trim()) return rows
        const needle = q.toLowerCase()
        const keys = searchKeys || columns.map((c) => c.key)
        return rows.filter((r) =>
            keys.some((k) => String(r[k] ?? '').toLowerCase().includes(needle))
        )
    }, [rows, q, searchKeys, columns])

    const sorted = useMemo(() => {
        if (!sort.key) return filtered
        const col = columns.find((c) => c.key === sort.key)
        const copy = [...filtered]
        copy.sort((a, b) => {
            const av = valueOf(a, col), bv = valueOf(b, col)
            const na = Number(av), nb = Number(bv)
            const numeric = !Number.isNaN(na) && !Number.isNaN(nb) && av !== '' && bv !== ''
            const cmp = numeric ? na - nb : String(av ?? '').localeCompare(String(bv ?? ''))
            return sort.dir === 'asc' ? cmp : -cmp
        })
        return copy
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, sort, columns])

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const current = Math.min(page, totalPages)
    const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize)

    const toggleSort = (col) => {
        if (!col.sortable) return
        setSort((s) =>
            s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }
        )
    }

    return (
        <div className="ui-surface overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 p-3 border-b ui-border">
                <div className="relative grow max-w-xs">
                    <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ stroke: 'var(--ui-text-muted)' }} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
                    </svg>
                    <input
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setPage(1) }}
                        placeholder={searchPlaceholder}
                        className="ui-input"
                        style={{ paddingLeft: '2.25rem' }}
                    />
                </div>
                {toolbar}
                <span className="ui-muted text-sm ml-auto">{sorted.length} result{sorted.length === 1 ? '' : 's'}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="ui-table">
                    <thead>
                        <tr>
                            {columns.map((col) => {
                                const active = sort.key === col.key
                                return (
                                    <th
                                        key={col.key}
                                        className={col.sortable ? 'ui-th-sort' : ''}
                                        style={{ textAlign: col.align || 'left' }}
                                        onClick={() => toggleSort(col)}
                                        title={col.sortable ? 'Click to sort' : undefined}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.header}
                                            {col.sortable ? (
                                                <SortArrows dir={active ? sort.dir : null} />
                                            ) : null}
                                        </span>
                                    </th>
                                )
                            })}
                            {rowActions ? <th style={{ textAlign: 'right' }}>Actions</th> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="ui-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row, i) => (
                                <tr key={rowKey(row, i)}>
                                    {columns.map((col) => (
                                        <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                                            {col.render ? col.render(row) : String(valueOf(row, col) ?? '')}
                                        </td>
                                    ))}
                                    {rowActions ? <td style={{ textAlign: 'right' }}>{rowActions(row)}</td> : null}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
                <div className="flex items-center justify-between p-3 border-t ui-border text-sm">
                    <span className="ui-muted">Page {current} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button className="ui-btn ui-btn-ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>Prev</button>
                        <button className="ui-btn ui-btn-ghost" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>Next</button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

/**
 * Stacked up/down sort indicator. Always visible on sortable columns (dimmed) so
 * users know the header is clickable; the active direction is highlighted.
 */
function SortArrows({ dir }) {
    return (
        <span className="inline-flex flex-col leading-none" style={{ fontSize: '0.55rem' }} aria-hidden="true">
            <span style={{ opacity: dir === 'asc' ? 1 : 0.3, color: dir === 'asc' ? 'var(--ui-primary)' : 'currentColor', marginBottom: '-2px' }}>▲</span>
            <span style={{ opacity: dir === 'desc' ? 1 : 0.3, color: dir === 'desc' ? 'var(--ui-primary)' : 'currentColor' }}>▼</span>
        </span>
    )
}

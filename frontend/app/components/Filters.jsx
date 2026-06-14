'use client'
import { useEffect, useState } from 'react'
import { getJSON } from '../lib/safeFetch'
import { makeToken, useFilters } from '../Context/FilterContext'
import { Checkbox, RemoveFilters, FilterTags, FiltersSkeleton } from '.'

/**
 * Dynamic product filters, sourced entirely from the DB via /products/filters.
 * Covers every dimension that real products have: Category, Model, Type, and
 * Edition — each with a live count. Replaces the old hardcoded device list that
 * didn't match the actual data.
 */

const TITLES = {
    categories: 'Category',
    types: 'Type',
    models: 'Model',
    editions: 'Edition',
}

const cap = (s) => String(s ?? '').replace(/\b\w/g, (c) => c.toUpperCase())

function FilterGroup({ dimension, title, options, as = 'checkbox' }) {
    const { isSelected, toggle } = useFilters()
    const [open, setOpen] = useState(true)

    if (!options || options.length === 0) return null

    return (
        <div className="flex flex-col gap-2 text-sm">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-between w-full"
            >
                <h2 className="text-lg font-semibold">{title}</h2>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`size-4 stroke-off-black transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            <div
                className={`pl-1 flex flex-col gap-2 font-light overflow-hidden transition-all duration-300 ${
                    open ? 'max-h-[40rem] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {as === 'tags' ? (
                    <FilterTags dimension={dimension} options={options} />
                ) : (
                    options.map((opt, indx) => {
                        const token = makeToken(dimension, opt.value)
                        return (
                            <Checkbox
                                key={`${token}-${indx}`}
                                text={`${cap(opt.value)}${opt.count != null ? ` (${opt.count})` : ''}`}
                                checked={isSelected(token)}
                                onToggle={() => toggle(token)}
                            />
                        )
                    })
                )}
            </div>
        </div>
    )
}

function Filters() {
    const [data, setData] = useState({ categories: [], models: [], types: [], editions: [] })
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let active = true
        ;(async () => {
            const result = await getJSON('/products/filters')
            if (!active) return
            if (result.ok && result.data && typeof result.data === 'object') {
                // De-duplicate models/types (they come grouped per category from the API).
                const dedupe = (arr) => {
                    const map = new Map()
                    for (const row of arr || []) {
                        const key = String(row.value).toLowerCase()
                        const prev = map.get(key)
                        map.set(key, { value: row.value, count: (prev?.count || 0) + (row.count || 0) })
                    }
                    return [...map.values()]
                }
                setData({
                    categories: dedupe(result.data.categories),
                    models: dedupe(result.data.models),
                    types: dedupe(result.data.types),
                    editions: dedupe(result.data.editions),
                })
                setStatus('ready')
            } else {
                setStatus('error')
            }
        })()
        return () => {
            active = false
        }
    }, [])

    if (status === 'loading') return <FiltersSkeleton />

    return (
        <div className="col-span-0 xl:col-span-2 hidden xl:flex flex-col gap-6">
            <div className="flex pb-2 border-b border-gray-500 h-10 items-center justify-between">
                <h2 className="font-semibold">Filters</h2>
                <RemoveFilters />
            </div>

            {status === 'error' ? <p className="font-light text-sm text-blue">Couldn&apos;t load filters.</p> : null}

            {status === 'ready' ? (
                <div className="flex flex-col gap-6">
                    <FilterGroup dimension="category" title={TITLES.categories} options={data.categories} />
                    <FilterGroup dimension="type" title={TITLES.types} options={data.types} />
                    <FilterGroup dimension="model" title={TITLES.models} options={data.models} as="tags" />
                    <FilterGroup dimension="edition" title={TITLES.editions} options={data.editions} />
                </div>
            ) : null}
        </div>
    )
}

export default Filters

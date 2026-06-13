'use client'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * Filtering state for the products page.
 *
 * `selected` holds a set of active filter tokens, each namespaced by dimension
 * so category/model/type/edition can be combined:
 *   "category:iphone", "model:13 pro", "type:magnet", "edition:dubai edition"
 *
 * `selectedFilter` remains for the sort dropdown (Recent / Price / Trend).
 */
const FilterContext = createContext(null)

export const makeToken = (dimension, value) => `${dimension}:${String(value).toLowerCase()}`

export function FilterWrapper({ children }) {
    const [selected, setSelected] = useState(() => new Set())
    const [selectedFilter, setSelectedFilter] = useState(null)

    const toggle = useCallback((token) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(token)) next.delete(token)
            else next.add(token)
            return next
        })
    }, [])

    const clear = useCallback(() => setSelected(new Set()), [])

    const isSelected = useCallback((token) => selected.has(token), [selected])

    const value = useMemo(
        () => ({
            selected,
            toggle,
            clear,
            isSelected,
            count: selected.size,
            selectedFilter,
            setSelectedFilter,
        }),
        [selected, toggle, clear, isSelected, selectedFilter]
    )

    return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
    const ctx = useContext(FilterContext)
    if (ctx) return ctx
    return {
        selected: new Set(),
        toggle: () => {},
        clear: () => {},
        isSelected: () => false,
        count: 0,
        selectedFilter: null,
        setSelectedFilter: () => {},
    }
}

export { FilterContext }
export default FilterContext

'use client'
import { useEffect, useMemo, useState } from "react"
import { Product, ProductsGridSkeleton } from "."
import { useFilters } from "../Context/FilterContext";
import ProductsBar from "./ProductsBar";
import { getJSON } from "../lib/safeFetch";

/**
 * Products listing with DB-driven, multi-dimensional filtering.
 *
 * Filter tokens are namespaced ("category:iphone", "model:13 pro", ...). A
 * product matches when, for every dimension that has any selection, its value
 * is among that dimension's selected values (AND across dimensions, OR within).
 * Sorting (Recent/Price/Trend) is applied after filtering on a copy.
 */
function Products() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const { selected, selectedFilter } = useFilters()

  useEffect(() => {
    let active = true
    ;(async () => {
      setIsLoading(true)
      setLoadError(false)
      const result = await getJSON('/products')
      if (!active) return
      if (result.ok && Array.isArray(result.data)) {
        setProducts(result.data)
      } else {
        setProducts([])
        setLoadError(true)
      }
      setIsLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Group selected tokens by dimension.
  const selectedByDimension = useMemo(() => {
    const groups = {}
    for (const token of selected) {
      const idx = token.indexOf(':')
      if (idx === -1) continue
      const dim = token.slice(0, idx)
      const val = token.slice(idx + 1)
      ;(groups[dim] ||= new Set()).add(val)
    }
    return groups
  }, [selected])

  const matchesFilters = (product) => {
    for (const [dim, values] of Object.entries(selectedByDimension)) {
      const field =
        dim === 'category' ? product?.category
        : dim === 'model' ? product?.model
        : dim === 'type' ? product?.type
        : dim === 'edition' ? product?.edition
        : null
      if (field == null) return false
      if (!values.has(String(field).toLowerCase())) return false
    }
    return true
  }

  const sortProducts = (list) => {
    const copy = [...list]
    if (selectedFilter?.name === 'Trend') return copy.filter((p) => p.trend === true)
    if (selectedFilter?.name === 'Price') return copy.sort((a, b) => b.price - a.price)
    // Recent / default: newest first.
    return copy.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  }

  const filtered = useMemo(() => {
    const base = Array.isArray(products) ? products.filter(matchesFilters) : []
    return sortProducts(base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, selectedByDimension, selectedFilter])

  const hasFilters = selected.size > 0

  return (
    <div className='col-span-10 xl:col-span-8 flex flex-col gap-6 '>
      <ProductsBar
        textHeader={hasFilters ? `Filtered: ${filtered.length}` : `Showing ${products.length}`}
      />

      {isLoading ? <ProductsGridSkeleton count={6} /> : null}

      {loadError && !isLoading ? (
        <p className="font-light text-blue">
          We couldn&apos;t load the products right now. Please refresh to try again.
        </p>
      ) : null}

      {/* Keyed on the active filter/sort signature so cards re-animate (fade +
          rise, lightly staggered) every time the result set changes. */}
      {!isLoading && !loadError ? (
        <div
          key={`${[...selected].sort().join('|')}::${selectedFilter?.name || 'default'}`}
          className="products grid grid-cols-1 xl:grid-cols-3 gap-x-6 gap-y-20 xl:gap-y-10"
        >
          {filtered.map((product, indx) => (
            <div
              key={product?.id ?? indx}
              className="reveal"
              style={{ animationDelay: `${Math.min(indx * 45, 400)}ms` }}
            >
              <Product details={product} />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !loadError && filtered.length === 0 ? (
        <p className="font-light">No products match your filters.</p>
      ) : null}
    </div>
  )
}

export default Products

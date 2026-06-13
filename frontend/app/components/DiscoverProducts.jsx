'use client'
import { useEffect, useState } from 'react'
import { Product } from '.'
import { getJSON } from '../lib/safeFetch'

/**
 * "Discover" strip — shows the first few products on the homepage.
 * Fixed: the effect had no dependency array (refetched on every render); now
 * runs once. Uses safeFetch and always renders from a guaranteed array.
 */
function DiscoverProducts() {
  const [productsList, setProductsList] = useState([])

  useEffect(() => {
    let active = true
    const fetchProducts = async () => {
      const result = await getJSON('/products')
      if (!active) return
      setProductsList(result.ok && Array.isArray(result.data) ? result.data : [])
    }

    fetchProducts()
    return () => {
      active = false
    }
  }, [])

  if (productsList.length === 0) {
    return <div className="font-light">No products to show right now.</div>
  }

  return (
    <>
      {productsList.slice(0, 3).map((p, indx) => (
        <Product key={p?.id ?? indx} details={p} />
      ))}
    </>
  )
}

export default DiscoverProducts

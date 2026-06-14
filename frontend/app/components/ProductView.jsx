'use client'
import React, { useEffect, useState } from "react";
import { ProductDetails, ProductImages, ProductViewContainer, ProductSpecs } from "@/app/components";
import { getJSON } from "../lib/safeFetch";

/**
 * Product detail view. Hardened:
 *  - data via safeFetch; tracks loading / not-found / error explicitly.
 *  - never feeds undefined image URLs to the image grid (ProductImages +
 *    ImageContainer also guard).
 *  - `product` defaults to an empty object so child accessors stay safe.
 */
export default function ProductView({ params }) {
    const { id } = React.use(params)

    const [product, setProduct] = useState({})
    const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'notfound' | 'error'

    useEffect(() => {
        if (!id) return
        let active = true

        const getData = async () => {
            setStatus('loading')
            const result = await getJSON(`/products/${id}`)
            if (!active) return

            if (result.ok && result.data && typeof result.data === 'object' && result.data.id) {
                setProduct(result.data)
                setStatus('ready')
            } else if (result.status === 404) {
                setProduct({})
                setStatus('notfound')
            } else {
                setProduct({})
                setStatus('error')
            }
        }

        getData()
        return () => {
            active = false
        }
    }, [id])

    if (status === 'loading') {
        return <p className="font-light py-10">Loading product…</p>
    }
    if (status === 'notfound') {
        return <p className="font-light py-10 text-blue">This product could not be found.</p>
    }
    if (status === 'error') {
        return <p className="font-light py-10 text-blue">We couldn&apos;t load this product. Please try again.</p>
    }

    const images = [product.image_url_1, product.image_url_2, product.image_url_3]

    return (
        <div className="flex flex-col gap-6 h-fit">
            {/* Top card: images + buy box. Height fits content (no fixed height). */}
            <ProductViewContainer classes='product grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-16'>
                <ProductImages images={images} />
                <ProductDetails details={product} />
            </ProductViewContainer>

            {/* Full-width specifications below the buy card. */}
            <ProductViewContainer classes='product' overlap={false}>
                <ProductSpecs details={product} />
            </ProductViewContainer>
        </div>
    )
}

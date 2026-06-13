import React from 'react'
import { ProductHeader, ProductPrice, ProductRate } from './index'

/**
 * Card body for a product. Guards against missing fields so a partial/empty
 * product object (e.g. mid-fetch) renders placeholders instead of "undefined".
 */
function ProductCardDetails({ data }) {
  const edition = data?.edition ? String(data.edition).toUpperCase() : ''
  const category = data?.category ?? ''
  const model = data?.model ?? ''

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex gap-4'>
        <ProductHeader header={edition} subheader={`${category} ${model}`.trim()} />
        <ProductRate />
      </div>

      <ProductPrice price={data?.price} />
    </div>
  )
}

export default ProductCardDetails

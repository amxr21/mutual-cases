import React from 'react'

/**
 * Product card title block. The subheader (category + model) is clamped to a
 * single line (truncate) so every card keeps a consistent height regardless of
 * name length.
 */
function ProductHeader({ header, subheader }) {
  return (
    <div className='w-11/12 min-w-0'>
      <div className='flex justify-between'>
        <p className="product-category nav-link truncate">{header}</p>
      </div>
      <p className="product-header header truncate whitespace-nowrap" title={subheader}>{subheader}</p>
    </div>
  )
}

export default ProductHeader

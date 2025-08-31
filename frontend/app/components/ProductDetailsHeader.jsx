import React from 'react'

function ProductDetailsHeader({ details }) {
  return (
    <div className="main-header">
        <h1 className="text-5xl">{`${details.category} ${details.model}`} Case</h1>
        <h4 className="text-3xl font-light capitalize">{details.edition}</h4>
    </div>
  )
}

export default ProductDetailsHeader
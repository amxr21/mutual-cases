import React from 'react'
import Image from 'next/image'

/**
 * Generic image box with a fixed set of width presets keyed by `pos`. Guards
 * against missing/invalid sources: when `imageSrc` is falsy it renders just the
 * styled box (no next/image), avoiding the runtime throw next/image raises on
 * an empty src. Static imports (objects) and non-empty string URLs are allowed.
 */
function ImageContainer({ imageSrc, pos = null, classes = '' }) {
  const width =
    pos == 0 ? '15.5rem'
    : pos == 1 ? '10rem'
    : pos == 2 ? '15rem'
    : pos == 3 ? '14rem'
    : pos == 4 ? '15.5rem'
    : pos == 5 ? '10rem'
    : pos == 6 ? '15rem'
    : pos == 7 ? '14rem'
    : pos == 8 ? '15.5rem'
    : pos == 9 ? '10rem'
    : pos == 10 ? '15rem' : pos || '15.5rem'

  // Accept either a static import (object) or a non-empty string URL.
  const hasValidSrc =
    imageSrc != null && (typeof imageSrc !== 'string' || imageSrc.trim().length > 0)

  return (
    <div style={{ width }} className={`${classes} relative image-container bg-light-blue rounded-lg h-64 overflow-hidden`}>
      {hasValidSrc ? (
        <Image src={imageSrc} alt="" fill className="object-cover" />
      ) : null}
    </div>
  )
}

export default ImageContainer

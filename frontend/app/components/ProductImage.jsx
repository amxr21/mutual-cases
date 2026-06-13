import Image from 'next/image'

import { Label } from './index'
import { starsEmoji } from '../constants/imags';

/**
 * Convert a Google Drive share URL into a direct thumbnail URL.
 * Returns null for anything that isn't a recognizable Drive link.
 */
function getDriveDirectLink(url) {
  const regex = /\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/;
  const match = typeof url === 'string' ? url.match(regex) : null;
  const fileId = match ? (match[1] || match[2]) : null;
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}`;
}

/**
 * Product card image. Previously called getDriveDirectLink() with NO argument
 * in the render guard (always null) and passed next/image no dimensions. Now it
 * resolves the link once, guards on it, and uses `fill`. Falls back to the
 * styled placeholder box when the URL isn't a valid Drive link.
 */
function ProductImage({ trend, imageUrl }) {
  const src = getDriveDirectLink(imageUrl);

  return (
    <div className='relative bg-gray-400 rounded-lg overflow-hidden min-h-48'>
      {src ? <Image src={src} alt='product image' fill className='object-cover' /> : null}
      {trend ? <Label key="trend" text="Trend" emoji={starsEmoji} /> : null}
    </div>
  )
}

export default ProductImage

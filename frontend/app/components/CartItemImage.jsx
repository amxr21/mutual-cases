import Image from "next/image"

/**
 * Cart line-item thumbnail. Renders a neutral placeholder box when no valid
 * image URL is provided (the API often returns null/empty image_url_1), instead
 * of handing next/image an invalid src (which throws).
 */
function CartItemImage({ imageSrc, imageAlt = 'product image' }) {
  const hasValidSrc = typeof imageSrc === 'string' && imageSrc.trim().length > 0

  return (
    <div className="item-image relative w-full xl:w-4/12 h-28 xl:h-full rounded-lg bg-gray-300 overflow-hidden">
      {hasValidSrc ? (
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
      ) : null}
    </div>
  )
}

export default CartItemImage

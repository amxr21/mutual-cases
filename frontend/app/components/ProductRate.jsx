import { Star } from "../constants/icons";
import Image from "next/image";

/**
 * Compact rating badge for product cards. Shows the product's real average
 * rating from the reviews table; renders "New" when there are no reviews yet
 * (no more hardcoded 4.5).
 */
function ProductRate({ rating = 0, count = 0 }) {
  const value = Number(rating) || 0
  const hasReviews = Number(count) > 0

  return (
    <div className="flex items-center gap-1 product-rate shrink-0">
      <Image src={Star} alt="" className="w-4 h-4" />
      {hasReviews ? (
        <span className="average-rating font-semibold text-sm">{value.toFixed(1)}</span>
      ) : (
        <span className="font-light text-xs text-off-black/50">New</span>
      )}
    </div>
  )
}

export default ProductRate

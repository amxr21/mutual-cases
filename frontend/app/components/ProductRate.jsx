import { Star } from "../constants/icons";
import Image from "next/image";

/**
 * Compact rating badge shown on product cards. The old non-functional heart
 * button here was removed — liking is handled by the LikeButton overlay on the
 * card image, so this just shows the average rating.
 */
function ProductRate() {
  return (
    <div className="flex items-center gap-1 product-rate shrink-0">
      <Image src={Star} alt="" className="w-4 h-4" />
      <span className="average-rating font-semibold text-sm">4.5</span>
    </div>
  )
}

export default ProductRate

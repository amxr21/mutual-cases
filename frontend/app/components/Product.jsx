import Link from 'next/link';
import { ProductCardDetails, ProductImage } from './index';
import LikeButton from './LikeButton';

/**
 * Product card. Wraps the image in a relative container so the like button can
 * float over it, and animates a subtle lift on hover.
 */
function Product({ details }) {
  // Guard the link target; if there's no id, link to the listing instead of /products/undefined.
  const href = details?.id ? `/products/${details.id}` : '/products'

  return (
    <Link href={href} className="group block">
      <div className='w-full flex flex-col gap-3 transition-transform duration-300 group-hover:-translate-y-1'>
        <div className="relative">
          <ProductImage trend={details?.trend} imageUrl={details?.image_url_1} />
          {details?.id ? <LikeButton productId={details.id} /> : null}
        </div>
        <ProductCardDetails data={details ?? {}} />
      </div>
    </Link>
  )
}

export default Product

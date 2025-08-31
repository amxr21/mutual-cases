import Link from 'next/link';
import { ProductCardDetails, ProductImage } from './index';


function Product({ details }) {
  return (
    <Link href={`/products/${details.id}`}>
      <div className='w-full flex flex-col gap-3 '>
          <ProductImage trend={details?.trend} imageUrl = {details?.image_url_1} />
          <ProductCardDetails data = { details } />
      </div>
    </Link>
  )
}

export default Product
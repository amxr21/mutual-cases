import Link from "next/link"
import { LargeButton, ShippingFeatures, ProductDetailsHeader, ProductDetailsPrice, ProductDetailsCategory, AddToCart, LikeButton } from "."

function ProductDetails({ details }) {
  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">

        <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-3">
                <ProductDetailsCategory details={details} />
                <ProductDetailsHeader details={details} />
            </div>
            {details?.id ? <LikeButton productId={details.id} variant="inline" size="lg" /> : null}
        </div>

        <div className="flex flex-col gap-3">
            <ProductDetailsPrice details={details} />
            <div className="buttons flex flex-col xl:flex-row gap-2 xl:gap-5">

                <AddToCart id={ details?.id } />

                <Link href={'/cart'} className="w-full">
                  <LargeButton key={'Checkout'} handleClick={() => {}} text="Checkout" color="white" classes="w-full"  />
                </Link>
            </div>
        </div>

        <ShippingFeatures />


    </div>
  )
}

export default ProductDetails
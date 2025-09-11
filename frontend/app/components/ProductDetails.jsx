import Link from "next/link"
import { LargeButton, ShippingFeatures, ProductDetailsHeader, ProductDetailsPrice, ProductDetailsCategory, AddToCart } from "."

function ProductDetails({ details }) {
  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">

        <div className="flex flex-col gap-3">
            <ProductDetailsCategory details={details} />
            <ProductDetailsHeader details={details} />
        </div>

        <div className="flex flex-col gap-3">
            <ProductDetailsPrice details={details} />
            <div className="buttons flex gap-5">

                <AddToCart id={ details.id } />
                
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
import { LargeButton, ShippingFeatures, ProductDetailsHeader, ProductDetailsPrice, ProductDetailsCategory } from "."

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
                <LargeButton key={'Add To Cart'} handleClick={() => {}} text="Add To Cart" color="blue" classes="w-full"  />
                <LargeButton key={'Checkout'} handleClick={() => {}} text="Checkout" color="white" classes="w-full"  />
            </div>
        </div>

        <ShippingFeatures />


    </div>
  )
}

export default ProductDetails
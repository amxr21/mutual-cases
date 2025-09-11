import { ProductViewContainer, OrderOptions, Total, CartItem, CartItems } from "@/app/components"
import CartSection from "@/app/components/Cart"
export default function Cart() {
  
  return (
    <ProductViewContainer>
      <div className="flex flex-col gap-8">
        <CartSection />
      </div>

    </ProductViewContainer>
  )
}

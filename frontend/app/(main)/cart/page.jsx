import { ProductViewContainer, OrderOptions, Total, CartItem } from "@/app/components"

export default function Cart() {
  
  return (
    <ProductViewContainer>
      <div className="flex flex-col gap-8">
        <div className="cart-items flex flex-col items-end gap-4">
          <CartItem />
          <CartItem />
          <CartItem />
          <CartItem />
          <CartItem />
          <OrderOptions />
        </div>

        <Total />
      </div>


      

      
    </ProductViewContainer>
  )
}

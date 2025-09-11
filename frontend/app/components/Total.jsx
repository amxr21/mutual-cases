'use client'
import { useContext, useEffect, useState } from "react"
import { LargeButton } from "."
import { CartContext } from "../Context/CartContext"

function Total() {
  
  const { cartDetails } = useContext(CartContext)
  const [ total, setTotal ] = useState(0);

  useEffect(() => {
    if (Array.isArray(cartDetails.cartItems)) {
    const totalPrice = cartDetails.cartItems.reduce(
      (sum, item) => sum + item?.price * item?.quantity, 
      0
    );
      setTotal(totalPrice);
    } else {
      setTotal(0); // fallback when cartItems isn't an array
    }
  }, [cartDetails])

  return (
      <div className="total flex gap-4">
        <h2 className="text-4xl pt-2 font-semibold border-t grow">Total: {total}AED</h2>
        <LargeButton text="Continue to Payment" color="blue" handleClick={() => {}} classes="text-xl" />
      </div>
  )
}

export default Total
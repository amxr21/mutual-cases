'use client'
import Link from "next/link"
import { LargeButton } from "."
import { useCart } from "../Context/CartContext"

/**
 * Cart total + checkout CTA. Reads the live total from the global cart, so it
 * stays in sync as quantities change anywhere.
 */
function Total() {
  const { totals, items } = useCart()

  return (
    <div className="total flex flex-col xl:flex-row gap-4 w-full">
      <h2 className="text-2xl xl:text-4xl pt-2 font-semibold border-t grow">
        Total: {totals.price} AED
      </h2>
      <Link href="/checkout" className={items.length === 0 ? 'pointer-events-none opacity-50' : ''}>
        <LargeButton text="Continue to Payment" color="blue" handleClick={() => {}} classes="text-xl" />
      </Link>
    </div>
  )
}

export default Total

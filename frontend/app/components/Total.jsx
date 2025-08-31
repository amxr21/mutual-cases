'use client'
import { LargeButton } from "."

function Total() {
  return (
      <div className="total flex gap-4">
        <h2 className="text-4xl pt-2 font-semibold border-t grow">Total: {10}AED</h2>
        <LargeButton text="Continue to Payment" color="blue" handleClick={() => {}} classes="text-xl" />
      </div>
  )
}

export default Total
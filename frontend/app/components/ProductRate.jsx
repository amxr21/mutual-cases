"use client"
import { Button } from "./index"

import { Heart } from "../constants/icons";

function ProductRate() {
  return (
    <div className="flex flex-col items-end product-rate w-2/12 overflow-hidden">
        <div className="average-rating font-semibold">4.5</div>
        <Button handleClick={() => {console.log('f');}} buttonContent={<Heart />} type="icon" classes="rounded-xl" />
    </div>
  )
}

export default ProductRate
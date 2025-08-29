"use client"
import { Filters, Products } from "@/app/components";
import { FilterWrapper } from "../Context/FilterContext";

function ProductsSection() {
  return (
    <div className="grid grid-cols-10 gap-8">
      <FilterWrapper>
        <Filters />
        <Products />
      </FilterWrapper>
    </div>
  )
}

export default ProductsSection
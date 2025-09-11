// import ProductsSection from "@/app/components/ProductsSection";
import { Filters, Products } from "@/app/components";
import { FilterWrapper } from "../../Context/FilterContext";
export const metadata = {
  title: "Mutual - Products ",
  description: ""
};

export default function products() {



  return (
    <main className="">
      {/* <ProductsSection /> */}
      <div className="grid grid-cols-10 gap-8">
        <FilterWrapper>
          <Filters />
          <Products />
        </FilterWrapper>
    </div>

    </main>
  )
}

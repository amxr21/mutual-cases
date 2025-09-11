import { SparkBanner, ProductView } from "../../../components/index";


// export const metadata = {
//   title: "Mutual - Productsss ",
//   description: ""
// };

export default function product({ params }) {

  return (
    <div className="flex flex-col gap-6 h-fit">
      <ProductView params={params}/>
      <SparkBanner />
    </div>
  )
}

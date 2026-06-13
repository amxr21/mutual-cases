import { ImageContainer } from "@/app/components"

/**
 * Product detail image grid. Accepts a (possibly sparse) array of image URLs.
 * ImageContainer itself guards empty sources, so partial data renders styled
 * placeholders rather than crashing.
 */
function ProductImages({ images = [] }) {
  const imgs = Array.isArray(images) ? images : []

  return (
    <div className="product-images flex flex-col gap-2 xl:gap-3 h-full overflow-hidden">
      <ImageContainer imageSrc={imgs[0]} classes="grow w-full max-h-48 xl:max-h-full" pos={'100%'} />
      <div className="sec-images flex gap-2 xl:gap-3 w-full h-24 xl:h-40">
        <ImageContainer imageSrc={imgs[1]} classes="flex grow h-full" />
        <ImageContainer imageSrc={imgs[2]} classes="flex grow h-full" />
      </div>
    </div>
  )
}

export default ProductImages

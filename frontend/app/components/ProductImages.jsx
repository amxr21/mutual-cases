import { ImageContainer } from "@/app/components"

function ProductImages({ images }) {
  return (
    <div className="product-images flex flex-col gap-3 h-full overflow-hidden">
        <ImageContainer imageSrc={images[0]} classes="grow w-full" pos={'100%'} />
        <div className="sec-images flex gap-3 w-full h-40">
            <ImageContainer imageSrc={images[1]} classes="flex grow h-full" />
            <ImageContainer imageSrc={images[2]} classes="flex grow h-full" />        
        </div>
    </div>
  )
}

export default ProductImages
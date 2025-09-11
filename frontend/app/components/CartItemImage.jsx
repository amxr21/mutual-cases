import Image from "next/image"

function CartItemImage({ imageSrc, imageAlt='image' }) {
  return (
    <div className="item-image w-3/12 h-full rounded-lg bg-gray-300">
        <Image src={imageSrc | "1"} alt={imageAlt} />
    </div>
  )
}

export default CartItemImage
'use client'
import { CaretItemPrice, CartItemHeader, CartItemImage, CartItemQuantity } from '.';

/**
 * A single cart line. Identified by product_id (the key the backend uses for all
 * cart operations), which fixes the earlier remove/quantity id mismatch.
 */
function CartItem({ itemDetails }) {
    const item = itemDetails ?? {}
    const productId = item.product_id ?? item.id

    return (
        <div className='flex flex-col xl:flex-row justify-between gap-5 border rounded-lg p-2 xl:h-32 min-w-full items-center transition-all duration-300'>
            <div className="details flex flex-col xl:flex-row items-center gap-2 xl:gap-4 grow h-full w-full xl:grow">
                <CartItemImage imageSrc={item.image_url_1} />
                <CartItemHeader item={item} />
            </div>
            <div className='flex justify-between w-full xl:w-fit xl:items-center xl:gap-4 '>
                <CaretItemPrice item={item} />
                <CartItemQuantity productId={productId} quantity={Number(item.quantity) || 1} />
            </div>
        </div>
    )
}

export default CartItem

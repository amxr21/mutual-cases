'use client'
import React, { useState } from 'react'
import { CaretItemPrice, CartItemHeader, CartItemImage, CartItemQuantity } from '.';

/**
 * A single cart line. Simplified: the item comes straight from props (the old
 * effect just copied the prop into state for no benefit). Count is seeded from
 * the item's quantity with a sane default; a count of 0 hides the row (used by
 * the optimistic remove flow).
 */
function CartItem({ itemDetails }) {
    const item = itemDetails ?? {}
    const [count, setCount] = useState(Number.isFinite(item.quantity) ? item.quantity : 1)

    if (count === 0) return ""

    return (
        <div className='flex flex-col xl:flex-row justify-between gap-5 border rounded-lg p-2 xl:h-32 min-w-full items-center'>
            <div className="details flex flex-col xl:flex-row items-center gap-2 xl:gap-4 grow h-full w-full xl:grow">
                <CartItemImage imageSrc={item.image_url_1} />
                <CartItemHeader item={item} />
            </div>
            <div className='flex justify-between w-full xl:w-fit xl:items-center xl:gap-4 '>
                <CaretItemPrice item={item} />
                <CartItemQuantity count={count} countFunc={setCount} itemId={item.id} />
            </div>
        </div>
    )
}

export default CartItem

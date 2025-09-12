'use client'
import React, { useEffect, useState } from 'react'
import { CaretItemPrice, CartItemHeader, CartItemImage, CartItemQuantity } from '.';

function CartItem({ itemDetails }) {

    const [ item, setItem ] = useState({});
    const [ count, setCount ] = useState(itemDetails.quantity)

    useEffect(() => {
        const getItem = async () => {
            // const res = await fetch("http://localhost:3000/products/11");
            // const product = await res.json();

            // setItem(product)
            setItem(itemDetails)
        }

        getItem();
    }, [])

  return (
    count != 0 ? <div className='flex flex-col xl:flex-row justify-between gap-5 border rounded-lg p-2 xl:h-32 min-w-full items-center'>
        <div className="details flex flex-col xl:flex-row items-center gap-2 xl:gap-4 grow h-full xl:h-fit w-full xl:w-fit">
            <CartItemImage imageSrc={item.image_url_1} />
            <CartItemHeader item={item} />            
        </div>
        <div className='flex justify-between w-full xl:items-center xl:gap-4 '>
            <CaretItemPrice item={item} />
            <CartItemQuantity count={count} countFunc={setCount} itemId ={itemDetails.id} />
        </div>
    </div> : ""
  )
}

export default CartItem
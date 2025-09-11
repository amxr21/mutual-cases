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
    count != 0 ? <div className='flex justify-between gap-5 border rounded-lg p-2 h-32 min-w-full items-center'>
        <div className="details flex items-center gap-4 grow h-full ">
            <CartItemImage imageSrc={item.image_url_1} />
            <CartItemHeader item={item} />            
        </div>
        <div className='flex items-center gap-4 '>
            <CaretItemPrice item={item} />
            <CartItemQuantity count={count} countFunc={setCount} itemId ={itemDetails.id} />
        </div>
    </div> : ""
  )
}

export default CartItem
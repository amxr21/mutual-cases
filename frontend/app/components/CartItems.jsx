'use client'

import { useContext, useEffect, useState } from "react"
import { CartItem } from "."
import { CartContext } from "../Context/CartContext"
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL


function CartItems() {
    const { cartDetails, setCartDetails  } = useContext(CartContext)

    
    const [ items, setItems ] = useState([])
    useEffect(() => {
        // console.log(cartDetails);

    }, [items, cartDetails])

    useEffect(() => {
        const userId = localStorage.getItem('userId')
        
        const getCartItems = async () => {
            const response = await fetch(`${API_ENDPOINT}/cart/${userId}`);
            const items = await response.json();
            
            if(items){
                setItems(items)
                setCartDetails((prev) => ({...prev, cartItems: items}))
            }
            // console.log(items);
        }
        
        getCartItems()
        if(items){

            console.log(items);
        }
        

    }, [])
    


  return (
    <>
        {
            items?.map((item, indx) => {
                return <CartItem key={indx} itemDetails={item} />
            })
        }
    </>
  )
}

export default CartItems
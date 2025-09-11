'use client'
import { Dropdown } from 'primereact/dropdown';
import { Button, RemoveItemBtn, } from '.';
import { useContext, useEffect } from 'react';
import { CartContext } from '../Context/CartContext';

function CartItemQuantity({ count, countFunc, remove = true, itemId }) {
  const { cartDetails, setCartDetails } = useContext(CartContext)
  
  const link = "http://localhost:3000"

  useEffect(() => {
    console.log(cartDetails);
    
    try {
      const updateCartItem = async () => {
        const response = await fetch(`${link}/cart`, {
          method: 'PATCH',
          headers: {'Content-Type' : 'application/json'},
          body: JSON.stringify({
            id: itemId,
            quantity: count,
          }),
        })
        
        const data = await response.json();

        console.log(data);
        if(!response.ok){
          throw Error("There's an issue with the request")
        }

      }

      updateCartItem()


    } catch (error) {
      console.log(error);
      
    }
  }, [cartDetails])

  return (
    <div className="up quantity flex flex-col gap-1 justify-between">
        <Dropdown 
            value={count}
            
            onChange=
            {
                (e) => {
                    countFunc(e.target.value);  setCartDetails((prev) => ({
                      ...prev,
                      cartItems: prev.cartItems.map((item) => {
                        return item.id == itemId ? { ...item, quantity: e.target.value } : item
                      })
                    }
                  ))
                }
            }
            
            className="w-full bg-off-white text-off-black py-1 px-2 rounded-md flex gap-4 h-full items-center up" 
            options={[1,2,3,4,5,6,7,8,9,10]}
            optionLabel="name" 
            panelClassName='px-2 py-1 bg-off-white text-off-black mt-1 border-off-black rounded-md up'
            placeholder="1"
        />
        {
          remove && <RemoveItemBtn itemId={itemId} func={() => {countFunc(0)}} />
          // <Button type='text' buttonContent='X | Remove' classes={'bg-transparent h-full px-2 py-1'} handleClick={() => {countFunc(0)}} />

        }
    </div>
  )
}

export default CartItemQuantity
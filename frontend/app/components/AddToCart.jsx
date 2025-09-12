'use client'
import { useEffect } from "react"
import { LargeButton } from "."

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL

// const { user_id, product_id, quantity } = req.body

function AddToCart( {id} ) {
    
    const cartRequest = async (e) => {
        try {
            const userId = localStorage.getItem('userId')
            if(!userId) return alert("Please login first")

            const response = await fetch(`${API_ENDPOINT}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    product_id: id,
                    quantity: 1
                }),
            })
            
            console.log(response);
            

            if (!response.ok) {
                return alert("Failed to add item to cart")
            }

            const data = await response.json()
            console.log(data.itemStatus);
            

            // e.target.textContent = '...'
            if(data.itemStatus == 'added'){
                document.getElementById('Cart').lastElementChild.innerText = parseInt(document.getElementById('Cart').lastElementChild.innerText) + 1;
                // alert("Item added")
            }

        } catch (error) {
            // console.log(error);
            e.target.textContent = "Try"
            console.log(error);

            
        }
        // finally{
        //     e.target.textContent = 'Added !'
        // }

    }     
        

  return (
    <LargeButton key={'Add To Cart'} handleClick={cartRequest} text="Add To Cart" color="blue" classes="w-full"  />
  )
}

export default AddToCart
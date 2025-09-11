'use client'
import { useEffect } from "react"
import { LargeButton } from "."

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL

// const { user_id, product_id, quantity } = req.body

function AddToCart( {id} ) {
    
    const cartRequest = async (e) => {

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: localStorage.getItem('userId'),
                    product_id: id,
                    quantity: 1
                }),
            })
            const data = await response.json()
            console.log(data.itemStatus);
            

            // e.target.textContent = '...'
            if(data.itemStatus == 'added'){
                document.getElementById('Cart').lastElementChild.innerText = parseInt(document.getElementById('Cart').lastElementChild.innerText) + 1;
                // alert("Item added")

            }
            
            
            
        } catch (error) {
            // console.log(error);
            alert(error)
            
            e.target.textContent = "Try"
        }
        finally{
            e.target.textContent = 'Added !'
        }

    }     
        

  return (
    <LargeButton key={'Add To Cart'} handleClick={cartRequest} text="Add To Cart" color="blue" classes="w-full"  />
  )
}

export default AddToCart
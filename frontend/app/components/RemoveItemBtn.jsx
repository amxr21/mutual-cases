'use client'
import { useEffect, useState } from 'react';
import { Button, } from '.';

function RemoveItemBtn({ func, itemId }) {
    const link = `http://localhost:3000/cart/${itemId}`;

    const [ res, setRes ] = useState()
    

    // useEffect(() => {

        const removeItem = async () => {
            func();
            try{
                const res = await fetch(link, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify({
                        product_id: itemId
                    })
                })
    
                const data = await res.json()
    
                setRes(data)
                let a = parseInt(document.getElementById("Cart").lastElementChild.innerText);
                if(a > 1){document.getElementById("Cart").lastElementChild.innerText = a - 1}

            } catch(error){
                console.log('an error occured');
                
            }

        }


    // }, [])

    // const da = () => {
    //     func()
    // }

    useEffect(() => {
        console.log(res);
        
    }, [])


    
    return (
        <Button type='text' buttonContent='X | Remove' classes={'bg-transparent h-full px-2 py-1 down'} handleClick={removeItem} />
  )
}

export default RemoveItemBtn
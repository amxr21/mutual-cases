'use client'
import { useEffect, useState } from 'react'
import { Product } from '.'

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL


function DiscoverProducts( ) {

    const [ productsList, setProductsList ] = useState([])

    useEffect(() =>{
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_ENDPOINT}/products`)
                const data = await res.json();

                
                if(data) setProductsList(data)
                else throw Error("No data has been found")

                
            } catch (error) {
                return { error: error.message }
            }
        }

        fetchProducts()

 
    })



    return (
    <>
        {
            Array.isArray(productsList)
                ? productsList.slice(0,3).map((p, indx) => <Product key={indx} details={p} />)
                : <div>No products found</div>
        }
    </>
  )
}

export default DiscoverProducts
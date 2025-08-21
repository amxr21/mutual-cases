import React from 'react'
import { Header, Product } from '../components'

const fetchProducts = async () => {
    try {
        const data = await fetch("http://localhost:3000/products")
        const products = await data.json();

        
        
        return products;
        
    } catch (error) {
        return { error: error.message }
    }
}



async function Discover() {
    const productsList = await fetchProducts()    

    return (
        <section className='flex flex-col gap-10'>
            <Header key='Discover' headerText='Our Products' subheader={true} subheaderText={`Flexible. Secure. Instantly ready. \n Designed to stand, fold, and flex around your workflow — wherever that takes you`} mark={true} markClasses='-top-10 inset-x-0 flex justify-center' textAlignment='center' />
            <div className="products grid grid-cols-3 gap-10">
                {
                    productsList.map((p, indx) => {
                        return <Product key={indx} details={p} />
                    })
                }

            </div>
        </section>
  )
}

export default Discover
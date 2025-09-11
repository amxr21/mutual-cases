import React from 'react'
import { Header, Product, MainSection } from '../components';

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
        <MainSection classes="">
            <Header key='Discover' headerText='Our Products' subheader={true} subheaderText={`Flexible. Secure. Instantly ready. \n Designed to stand, fold, and flex around your workflow — wherever that takes you`} mark={true} markClasses='-top-10 inset-x-0 flex justify-center' textAlignment='center' />
            <div className="products grid grid-cols-3 gap-10">
                {
                    Array.isArray(productsList)
                        ? productsList.slice(0,3).map((p, indx) => <Product key={indx} details={p} />)
                        : <div>No products found</div>
                }
            </div>
        </MainSection>
  )
}

export default Discover
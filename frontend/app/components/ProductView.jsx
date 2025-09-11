'use client'
import React from "react";
import { ProductDetails, ProductImages, ProductViewContainer } from "@/app/components"; 
import { useEffect, useState } from "react";


export default function ProductView({ params }) {
    const { id } = React.use(params)
    
    const [ product, setProduct ] = useState({})
    
    useEffect(() => {
        if(id){

        const link = `http://localhost:3000/products/${id}`
        const getData = async () => {
            const response = await fetch(link)
            
            if(response.ok){
                const productDetails = await response.json()
                setProduct(productDetails);
                // return productDetails;
            }
            else{
                setProduct({});
            }
        }
        
        getData();
        console.log(product);
        }
    
      
  }, [id])


  return (
    <div className="flex flex-col gap-6 h-fit">

      <ProductViewContainer classes='product grid grid-cols-2 gap-16 h-[28rem]'>
        <ProductImages images={[product.image_url_1, product.image_url_2, product.image_url_3]} />
        <ProductDetails details={product} />
      </ProductViewContainer>

    </div>
  )
}

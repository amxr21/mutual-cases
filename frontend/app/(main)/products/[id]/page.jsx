'use client'
import React from "react";
import { ProductDetails, ProductImages, ProductViewContainer } from "@/app/components"; 
import { useEffect, useState } from "react";
import SparkBanner from "@/app/components/SparkBanner";


export default function product({ params }) {
  const { id } = React.use(params)
  const link = `http://localhost:3000/products/${id}`

  const [ product, setProduct ] = useState({})
  
  useEffect(() => {
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
    
      
  }, [])


  return (
    <div className="flex flex-col gap-6 h-fit">

      <ProductViewContainer classes='product grid grid-cols-2 gap-16 h-[28rem]'>
        <ProductImages images={[product.image_url_1, product.image_url_2, product.image_url_3]} />
        <ProductDetails details={product} />
      </ProductViewContainer>

      <SparkBanner />

    </div>
  )
}

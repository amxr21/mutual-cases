'use client'
import { useContext, useEffect, useState } from "react"
import { Product, ProductHeader } from "."
import { FilterContext } from "../Context/FilterContext";
import ProductsBar from "./ProductsBar";
const link = 'http://localhost:3000/products'

function Products() {

  const [ products, setProducts ] = useState([]);
  const [ isLoading, setIsLoading ] = useState(false);

  const [ filteredProducts, setFilteredProducts ] = useState([])

  const { filters, selectedFilter } = useContext(FilterContext) 

  useEffect(() => {
    // console.log(filters);

  }, [])
  


  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await fetch(link)
      const response = await data.json();
      // console.log(data);
      
      // console.log(response);
      
      setProducts(response);
    } catch (error) {
      console.log(error);
      
      setProducts([]);
    }

    finally{
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData();
  }, [])

  useEffect(() => {
    setFilteredProducts(
      products.filter((product) => {
        if( filters.length == 0 ){
          return product
        }
        else {
          if(product.category == 'iphone'){
            // console.log(filters, filters.includes(`iphone ${product.model.split(' ')[0]}`) ,`iphone ${product.model.split(' ')[0]}`);
            return filters.includes(`iphone ${product.model.split(' ')[0]}`) 
          }
          else if(product.category == 'ipad'){
            return filters.includes(product.type.split(' ')[0].toLowerCase()) 
          }
        }
      })
            
    )
    // console.log(filteredProducts);
  }, [products, filters])


  useEffect(() => {
    console.log(selectedFilter?.name);

    
    // console.log(products);
    // console.log('====================================================');
    // console.log(products.sort((a, b) => b.id - a.id));
    if(selectedFilter?.name == 'Trend'){
      setFilteredProducts([...products].filter( p => p.trend == true))
    }
    else if(selectedFilter?.name == 'Price'){
      // console.log(selectedFilter.name, selectedFilter.name == 'Price');
      
      setFilteredProducts([...products].sort((a, b) => b.price - a.price))
    }
    // else if(selectedFilter?.name == 'Recent'){
    //   setFilteredProducts([...products].sort((a, b) => b.updated_at - b.updated_at))
    // }
    else{
      setFilteredProducts([...products].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
    }
    
    
  }, [selectedFilter])
  


  return (
    <div className='col-span-8 flex flex-col gap-6 '>

      <ProductsBar textHeader={filters.length == 0 ? `Showing ${products?.length}` : `Filtered: ${filteredProducts.length}`} />


      <div className="products grid grid-cols-3 gap-x-6 gap-y-10">
        {
          filteredProducts?.length > 0 && filteredProducts.map((product, indx) => {
            return (
              <Product key={indx} details={product} />
            )
          })  
        }

        {
          products.length == 0 ? <h3>no products</h3> : ''
        }
      </div>
    </div>
  )
}

export default Products
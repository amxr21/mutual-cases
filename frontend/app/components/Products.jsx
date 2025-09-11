'use client'
import { useContext, useEffect, useState } from "react"
import { Product, ProductHeader } from "."
import { FilterContext } from "../Context/FilterContext";
import ProductsBar from "./ProductsBar";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL

function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { filters, selectedFilter } = useContext(FilterContext);

  // Fetch products from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_ENDPOINT}/products`);
      const data = await res.json();

      // Ensure data is always an array
      const productArray = Array.isArray(data) ? data : data.products || [];
      setProducts(productArray);
    } catch (error) {
      console.error("Fetch products error:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    const filtered = (products || []).filter((product) => {
      if (!filters || filters.length === 0) return true; // no filter, keep all

      if (product.category === 'iphone') {
        return filters.includes(`iphone ${product.model?.split(' ')[0]}`);
      } else if (product.category === 'ipad') {
        return filters.includes(product.type?.split(' ')[0].toLowerCase());
      }
      return false; // fallback
    });

    setFilteredProducts(filtered);
  }, [products, filters]);

  // Apply selected sorting filter
  useEffect(() => {
    let updatedProducts = [...(filteredProducts || [])];

    if (selectedFilter?.name === 'Trend') {
      updatedProducts = updatedProducts.filter(p => p.trend === true);
    } else if (selectedFilter?.name === 'Price') {
      updatedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      // Default: sort by updated_at descending
      updatedProducts.sort((a, b) => {
        const aDate = new Date(a.updated_at || 0);
        const bDate = new Date(b.updated_at || 0);
        return bDate - aDate;
      });
    }

    setFilteredProducts(updatedProducts);
  }, [selectedFilter, filteredProducts]);

  return (
    <div className='col-span-8 flex flex-col gap-6'>
      <ProductsBar
        textHeader={
          !filters || filters.length === 0
            ? `Showing ${products.length}`
            : `Filtered: ${filteredProducts.length}`
        }
      />

      <div className="products grid grid-cols-3 gap-x-6 gap-y-10">
        {filteredProducts.length > 0
          ? filteredProducts.map((product, indx) => (
              <Product key={indx} details={product} />
            ))
          : !isLoading && <h3>No products found</h3>}
      </div>
    </div>
  );
}

export default Products;



// 'use client'
// import { useContext, useEffect, useState } from "react"
// import { Product, ProductHeader } from "."
// import { FilterContext } from "../Context/FilterContext";
// import ProductsBar from "./ProductsBar";

// const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL

// function Products() {

//   const [ products, setProducts ] = useState([]);
//   const [ isLoading, setIsLoading ] = useState(false);

//   const [ filteredProducts, setFilteredProducts ] = useState([])

//   const { filters, selectedFilter } = useContext(FilterContext) 

//   useEffect(() => {
//     // console.log(filters);
//     console.log(API_ENDPOINT);
    
//   }, [])
  


//   const fetchData = async () => {
//     try {
//       setIsLoading(true);
//       const data = await fetch(`${API_ENDPOINT}/products`)
//       const response = await data.json();
//       // console.log(data);
      
//       // console.log(response);
      
//       setProducts(response);
//     } catch (error) {
//       console.log(error);
      
//       setProducts([]);
//     }

//     finally{
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchData();
//   }, [])

//   useEffect(() => {
//     setFilteredProducts(
//       products.filter((product) => {
//         if( filters.length == 0 ){
//           return product
//         }
//         else {
//           if(product.category == 'iphone'){
//             // console.log(filters, filters.includes(`iphone ${product.model.split(' ')[0]}`) ,`iphone ${product.model.split(' ')[0]}`);
//             return filters.includes(`iphone ${product.model.split(' ')[0]}`) 
//           }
//           else if(product.category == 'ipad'){
//             return filters.includes(product.type.split(' ')[0].toLowerCase()) 
//           }
//         }
//       })
            
//     )
//     // console.log(filteredProducts);
//   }, [products, filters])


//   useEffect(() => {
//     // console.log(products);
//     // console.log('====================================================');
//     // console.log(products.sort((a, b) => b.id - a.id));
//     if(selectedFilter?.name == 'Trend'){
//       setFilteredProducts([...products].filter( p => p.trend == true))
//     }
//     else if(selectedFilter?.name == 'Price'){
//       // console.log(selectedFilter.name, selectedFilter.name == 'Price');
      
//       setFilteredProducts([...products].sort((a, b) => b.price - a.price))
//     }
//     // else if(selectedFilter?.name == 'Recent'){
//     //   setFilteredProducts([...products].sort((a, b) => b.updated_at - b.updated_at))
//     // }
//     else{
//       setFilteredProducts([...products].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
//     }
    
    
//   }, [selectedFilter])
  


//   return (
//     <div className='col-span-8 flex flex-col gap-6 '>

//       <ProductsBar textHeader={filters.length == 0 ? `Showing ${products?.length}` : `Filtered: ${filteredProducts.length}`} />


//       <div className="products grid grid-cols-3 gap-x-6 gap-y-10">
//         {
//           filteredProducts?.length > 0 && filteredProducts.map((product, indx) => {
//             return (
//               <Product key={indx} details={product} />
//             )
//           })  
//         }

//         {
//           products.length == 0 ? <h3>no products</h3> : ''
//         }
//       </div>
//     </div>
//   )
// }

// export default Products
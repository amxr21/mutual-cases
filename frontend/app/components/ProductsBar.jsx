'use client'

import { Dropdown } from 'primereact/dropdown';
import React, { useContext, useState } from "react";
import { FilterContext } from '../Context/FilterContext';


function ProductsBar({ textHeader }) {
    
    const { selectedFilter, setSelectedFilter } = useContext(FilterContext);
    const filters = [
        { name: 'Recent' },
        { name: 'Price' },
        { name: 'Trend' },
    ];

    return (
        <div className='flex justify-between items-center font-semibold pb-2 border-b border-gray-500 h-10'>
            <h2 className="font-semibold">{textHeader} products</h2>
            <Dropdown 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.value)}
                className="w-36 text-sm xl:text-base bg-blue text-white py-1 px-2 rounded-md flex gap-4" 
                options={filters}
                optionLabel="name" 
                panelClassName='px-2 py-1 bg-blue text-white mt-1 border-off-black rounded-md'
                placeholder="Filter By"
            />
        </div>
    )
}

export default ProductsBar
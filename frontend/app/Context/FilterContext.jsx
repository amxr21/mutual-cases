'use client'

const { createContext, useState } = require("react")

const FilterContext = createContext();

const FilterWrapper = ({ children }) => {
    const [ filters, setFilters ] = useState([]);
    const [ selectedFilter, setSelectedFilter ] = useState(null)

    return (
        <FilterContext.Provider value={{ filters, setFilters, selectedFilter, setSelectedFilter }}>
            {children}
        </FilterContext.Provider>
    )


}


export { FilterWrapper, FilterContext }
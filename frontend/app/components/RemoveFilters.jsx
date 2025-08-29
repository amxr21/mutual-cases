'use client'

import { useContext } from "react"
import { FilterContext } from "../Context/FilterContext"

import { Button } from ".";

function RemoveFilters() {
    const { filters, setFilters } = useContext(FilterContext);


    const removeFilters = () => {
        setFilters([])
    }

  return (
    filters.length != 0 && <Button classes='p-1' handleClick={removeFilters} buttonContent={'Remove Filters'} />
  )
}

export default RemoveFilters
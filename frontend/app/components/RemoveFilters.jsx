'use client'
import { useFilters } from "../Context/FilterContext"
import { Button } from ".";

function RemoveFilters() {
    const { count, clear } = useFilters()

    return count !== 0 ? (
        <Button classes='p-1' handleClick={clear} buttonContent={'Remove Filters'} />
    ) : null
}

export default RemoveFilters

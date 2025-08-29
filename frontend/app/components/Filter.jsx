"use client"
import Image from "next/image"

import { Checkbox } from "."
import { Charm, IPad, IPhone } from "../constants/icons"
import { useEffect, useState } from "react"

import { useContext } from "react"
import { FilterContext } from "../Context/FilterContext"


function Filter({ device, models, filterFunc }) {
    // const [ checkedList, setCheckedList ] = useState([])
    
    const { filters, setFilters } = useContext(FilterContext);

    // console.log(filters);
    

    const handleToggle = (label) => {
        // filterFunc(checkedList)
    // setCheckedList((prev) => 
    //     prev.includes(label)
    //     ? prev.filter((item) => item !== label)
    //     : [...prev, label]

        setFilters((prev) => 
            prev.includes(label)
            ? prev.filter((item) => item !== label)
            : [...prev, label]
        )
    }


    // useEffect(() => {
    //     console.log('Updated Checked List:', filters);    
    // }, [filters])


    return (
    <div className="header flex flex-col gap-2 text-sm">
        <div className="type flex items-center gap-2">
            <div className="input flex gap-2">
                <Image alt={device} src={ device == 'iPhone' ? IPhone : device == 'iPad' ? IPad : Charm } />
                <h2 className="text-lg">{device}</h2>
            </div>
        </div>
            <div className="pl-6 font-light">
                {
                    models.map((model, indx) => {
                        return <Checkbox key={indx} text={model} checked={filters.includes(model.toLowerCase())} onToggle={() => {handleToggle(model.toLowerCase())}} />
                    } )
                }

            </div>
    
    </div>

  )
}

export default Filter
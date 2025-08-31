'use client'
import Image from 'next/image'
import { Gift, Note } from "../constants/icons"
import { useState } from 'react'

function OrderOption({ icon, text }) {
    const [ isClicked, setIsClicked ] = useState(false)

    const handleClick = () => {
        setIsClicked(p => !p)
    }

    return (
    <button onClick={handleClick} className={`flex items-center gap-3 text-blue ${!isClicked? 'bg-white  border border-blue' : 'bg-blue-200 border border-white'} rounded-lg w-48 px-3 py-1 cursor-pointer`}>
        <div className="icon ">
            <Image src={icon == 'gift' ? Gift : Note} alt={text} />

        </div>
        <h2 className='text-lg font-semibold '>{text}</h2>
    </button>
  )
}

export default OrderOption
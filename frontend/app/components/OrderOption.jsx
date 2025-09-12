'use client'
import Image from 'next/image'
import { Gift, Note } from "../constants/icons"
import { useContext, useEffect, useState } from 'react'
import { CartContext } from '../Context/CartContext'

function OrderOption({ icon, text }) {
    const [ isClicked, setIsClicked ] = useState(false)
    const { cartDetails, setCartDetails } = useContext(CartContext);

    useEffect(() => {
        console.log(cartDetails);
        
    }, [isClicked])

    const handleClick = () => {
        setIsClicked(p => !p)
        if(icon == 'gift'){
            setCartDetails((prev) => ({...prev, requests: {...prev.requests, gift: isClicked}}))
        }
        
        if(icon != 'gift'){
            setCartDetails((prev) => ({...prev, requests: {...prev.requests, note: text}}))
        }
    }

    return (
    <button onClick={handleClick} className={`flex items-center justify-center xl:justify-baseline gap-3 text-blue ${!isClicked? 'bg-white  border border-blue' : 'bg-blue-200 border border-white'} rounded-lg w-full xl:w-48 px-3 py-1 cursor-pointer`}>
        <div className="icon ">
            <Image src={icon == 'gift' ? Gift : Note} alt={text} />

        </div>
        <h2 className='text-lg font-semibold '>{text}</h2>
    </button>
  )
}

export default OrderOption
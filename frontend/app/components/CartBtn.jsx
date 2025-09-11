'use client'
import Link from 'next/link';
import { useEffect, useState } from 'react';

function CartBtn() {
    
    
    const [ cartLength, setCartLength ] = useState(0)
    
    useEffect(() => {
        const userId = localStorage.getItem("userId")
        const link = `http://localhost:3000/cart/${userId}`
        const getCartLength = async () => {
            const response = await fetch(link)
            const data = await response.json()
            setCartLength(data.length);
        }

        getCartLength();

    }, [])





    return (
        <Link id='Cart' href='/cart' className='nav-link relative' >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {
                cartLength != 0 ? <div className="badge w-4 h-4 bg-blue absolute -bottom-2 -right-2 rounded-md text-[0.7rem] text-center text-off-white">{cartLength}</div> : ''

            }
        </Link>
        
    )
}

export default CartBtn
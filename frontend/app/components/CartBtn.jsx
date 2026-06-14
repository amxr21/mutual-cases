'use client'
import Link from 'next/link';
import { useCart } from '../Context/CartContext';

/**
 * Nav cart icon with a live count badge from the global cart context, so it
 * updates instantly when items are added/removed anywhere.
 */
function CartBtn() {
    const { totals } = useCart()
    const count = totals.count

    return (
        <Link id='Cart' href='/cart' className='nav-link relative'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {count !== 0 ? (
                <div className="badge min-w-4 h-4 px-1 bg-blue absolute -bottom-2 -right-2 rounded-md text-[0.7rem] text-center text-off-white leading-4">
                    {count}
                </div>
            ) : null}
        </Link>
    )
}

export default CartBtn

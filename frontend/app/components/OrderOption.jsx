'use client'
import Image from 'next/image'
import { Gift, Note } from "../constants/icons"

/**
 * Presentational toggle button for an order option (gift / note). Controlled by
 * the parent (OrderOptions) so the active state can live in the global cart.
 */
function OrderOption({ icon, text, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex items-center justify-center xl:justify-start gap-3 rounded-lg w-full xl:w-48 px-3 py-2 cursor-pointer transition-all duration-300 active:scale-[0.98]
                ${active ? 'bg-blue text-off-white border border-blue shadow-sm' : 'bg-white text-blue border border-blue hover:bg-blue/5'}`}
        >
            <div className={`icon transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                <Image src={icon === 'gift' ? Gift : Note} alt={text} />
            </div>
            <h2 className='text-lg font-semibold'>{text}</h2>
        </button>
    )
}

export default OrderOption

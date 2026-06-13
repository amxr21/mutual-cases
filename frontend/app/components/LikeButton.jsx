'use client'
import { useState } from 'react'
import { useLike } from '../Context/LikeContext'

/**
 * Animated like (heart) button. Fills + pops on toggle, follows the brand
 * palette (gold when liked). Stops link navigation when placed on a product
 * card. `size` controls dimensions; `variant` switches between the floating
 * card overlay and an inline button.
 */
export default function LikeButton({ productId, size = 'md', variant = 'overlay', className = '' }) {
    const { isLiked, toggleLike } = useLike()
    const liked = isLiked(productId)
    const [burst, setBurst] = useState(false)

    const dims = size === 'lg' ? 'w-11 h-11' : size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
    const icon = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5'

    const handleClick = (e) => {
        // When the button sits inside a product <Link>, don't navigate.
        e.preventDefault()
        e.stopPropagation()
        setBurst(true)
        setTimeout(() => setBurst(false), 350)
        toggleLike(productId)
    }

    const base =
        variant === 'overlay'
            ? `absolute top-3 right-3 z-20 ${dims} rounded-full bg-off-white/90 backdrop-blur shadow-md flex items-center justify-center`
            : `${dims} rounded-full bg-off-white border border-black/5 shadow-sm flex items-center justify-center`

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-pressed={liked}
            aria-label={liked ? 'Remove from liked' : 'Add to liked'}
            className={`${base} transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer ${className}`}
        >
            <svg
                viewBox="0 0 24 24"
                className={`${icon} transition-all duration-300 ${burst ? 'scale-125' : 'scale-100'} ${
                    liked ? 'fill-gold stroke-gold' : 'fill-none stroke-off-black'
                }`}
                strokeWidth={1.6}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
            </svg>
        </button>
    )
}

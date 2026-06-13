'use client'
import Link from 'next/link'
import { useLike } from '../Context/LikeContext'

/**
 * Nav heart icon with a live count badge sourced from the global like context.
 */
function LikedBtn() {
    const { likedCount } = useLike()

    return (
        <Link id="Liked" href="/liked" className="nav-link relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {likedCount !== 0 ? (
                <div className="badge w-4 h-4 bg-gold absolute -bottom-2 -right-2 rounded-md text-[0.7rem] text-center text-off-white leading-4">
                    {likedCount}
                </div>
            ) : null}
        </Link>
    )
}

export default LikedBtn

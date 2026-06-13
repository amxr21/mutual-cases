'use client'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Logo } from '../constants/imags'

/**
 * Page-load cover + transition wrapper (#6 + #7).
 *
 * - Shows a branded loader (logo + subtle pulse/ring) over a LIGHT BLURRED
 *   backdrop on first load and on every route change, until the new page is
 *   ready. The backdrop is a translucent blur (not a solid color).
 * - Wraps page content in a fade/slide-up so navigations feel smooth.
 *
 * The App Router doesn't expose a "route finished" event for client navigations,
 * so we show the cover briefly on pathname change and fade it out on the next
 * paint — long enough to mask layout shift, short enough to feel instant.
 */
export default function PageTransition({ children }) {
    const pathname = usePathname()
    const [covering, setCovering] = useState(true) // cover on first mount
    const firstMount = useRef(true)

    useEffect(() => {
        // Show the cover on each navigation.
        setCovering(true)

        // Hide after the new content has had a moment to render/settle.
        const hide = setTimeout(() => setCovering(false), firstMount.current ? 600 : 450)
        firstMount.current = false

        return () => clearTimeout(hide)
    }, [pathname])

    return (
        <>
            {/* Transition cover */}
            <div
                aria-hidden={!covering}
                className={`fixed inset-0 z-[999998] flex items-center justify-center transition-opacity duration-500 ${
                    covering ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                    // Light, blurred backdrop — not a solid fill.
                    background: 'rgba(248, 248, 245, 0.55)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                }}
            >
                <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <span className="absolute inline-flex h-24 w-24 rounded-full bg-blue/10 animate-ping" />
                    <span className="absolute inline-flex h-20 w-20 rounded-full border-2 border-blue/30 border-t-blue animate-spin" />
                    {/* Logo */}
                    <Image
                        src={Logo}
                        alt="Mutual"
                        width={64}
                        height={64}
                        priority
                        className="relative w-12 h-12 object-contain animate-pulse"
                    />
                </div>
            </div>

            {/* Page content with enter animation, keyed on route so it re-runs per page */}
            <div key={pathname} className="page-enter">
                {children}
            </div>
        </>
    )
}

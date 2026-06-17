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

    // Show the cover immediately on an internal link click, so navigation feels
    // instant even before the route resolves (masks any data-fetch delay).
    useEffect(() => {
        const onClick = (e) => {
            // Ignore clicks on interactive controls (add-to-cart, qty +/-, etc.).
            // These often sit INSIDE a product-card <Link>; without this guard the
            // click bubbles to the link, we raise the cover, but no navigation
            // happens — so it never hides and the page looks stuck loading.
            if (e.target.closest?.('button, input, select, textarea, [role="button"]')) return
            const a = e.target.closest?.('a[href]')
            if (!a) return
            // Modifier-clicks / middle-clicks open new tabs — no in-app nav.
            if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
            const href = a.getAttribute('href')
            if (!href || href.startsWith('#') || a.target === '_blank' || href.startsWith('http') || a.hasAttribute('download')) return
            // Only for in-app navigations to a different path.
            if (href.startsWith('/') && href !== pathname) {
                setCovering(true)
                // Safety net: if the navigation never resolves (cancelled, same
                // route, error), force the cover off so it can't hang forever.
                clearTimeout(safetyTimer)
                safetyTimer = setTimeout(() => setCovering(false), 2000)
            }
        }
        let safetyTimer
        document.addEventListener('click', onClick, true)
        return () => { document.removeEventListener('click', onClick, true); clearTimeout(safetyTimer) }
    }, [pathname])

    return (
        <>
            {/* Transition cover — backdrop adapts to light/dark. */}
            <div
                aria-hidden={!covering}
                className={`page-cover fixed inset-0 z-[999998] flex items-center justify-center transition-opacity duration-500 ${
                    covering ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
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

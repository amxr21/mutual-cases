'use client'
import { usePathname } from 'next/navigation'
import { Navbar, Footer } from '../sections/index'
import PageTransition from './PageTransition'

/**
 * Renders the public store chrome (navbar, page transitions, footer) for normal
 * routes, but renders children bare for /admin/* so the dashboard gets its own
 * full-screen layout without the storefront navbar/footer.
 */
export default function Chrome({ children }) {
    const pathname = usePathname()
    // Admin and the delivery portal render bare (their own full-screen shells).
    const isBare = pathname?.startsWith('/admin') || pathname?.startsWith('/delivery')

    if (isBare) return <>{children}</>

    return (
        <>
            <div className="mx-8 xl:mx-20 my-3 xl:my-6 font-bold">
                <Navbar />
                <PageTransition>{children}</PageTransition>
            </div>
            <Footer />
        </>
    )
}

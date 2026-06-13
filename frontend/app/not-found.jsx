import Image from 'next/image'
import { Scratches } from './constants/imags'
import ErrorState from './components/ErrorState'

/**
 * 404 page. Rendered by Next.js for unmatched routes and explicit notFound()
 * calls. Uses the shared ErrorState for consistent messaging + recovery, with
 * the brand scratches backdrop.
 */
export default function NotFound() {
    return (
        <div className="relative">
            <ErrorState
                code="404"
                title="We couldn't find that page"
                message="The page you're looking for doesn't exist or may have moved. Let's get you back on track."
            />
            <Image
                src={Scratches}
                alt=""
                aria-hidden="true"
                className="absolute w-[50%] top-0 left-1/2 -translate-x-1/2 -z-10 pointer-events-none"
            />
        </div>
    )
}

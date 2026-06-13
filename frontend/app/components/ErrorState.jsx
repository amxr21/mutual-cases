'use client'
import Link from 'next/link'

/**
 * Shared, user-friendly error UI used by all error boundaries and the 404/error
 * pages. Explains the problem in plain language (no stack traces or codes shown
 * to users) and offers recovery actions (retry / go home).
 *
 * @param {object} props
 * @param {string} [props.code]      big display code, e.g. "404" / "500"
 * @param {string} [props.title]     short headline
 * @param {string} [props.message]   plain-language explanation
 * @param {() => void} [props.onRetry] optional retry handler (renders a button)
 * @param {boolean} [props.showHome=true]
 */
export default function ErrorState({
    code,
    title = 'Oops… something went wrong',
    message = 'An unexpected error occurred. Please try again in a moment.',
    onRetry,
    showHome = true,
}) {
    return (
        <div className="text-blue flex flex-col items-center py-20 xl:py-30 text-center relative min-h-[50vh] justify-center">
            {code ? <p className="text-[8rem] xl:text-[14rem] leading-[1] mb-6 xl:mb-12">{code}</p> : null}

            <p className="text-3xl xl:text-5xl font-semibold">{title}</p>

            <p className="my-4 font-light max-w-xl text-base xl:text-lg opacity-80">{message}</p>

            <div className="flex flex-col xl:flex-row gap-3 mt-4 z-50">
                {onRetry ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="underline cursor-pointer font-medium"
                    >
                        Try again
                    </button>
                ) : null}

                {showHome ? (
                    <Link className="underline cursor-pointer font-medium" href={'/'}>
                        Go back to Homepage
                    </Link>
                ) : null}
            </div>
        </div>
    )
}

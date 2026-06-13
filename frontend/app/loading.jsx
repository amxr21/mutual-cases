/**
 * Global route-level loading fallback. Shown during navigation/data loading for
 * any segment that suspends. Keeps the screen from flashing blank.
 */
export default function Loading() {
    return (
        <div className="text-blue flex flex-col items-center justify-center py-20 xl:py-30 min-h-[40vh]">
            <div
                className="w-10 h-10 rounded-full border-4 border-light-blue border-t-blue animate-spin"
                role="status"
                aria-label="Loading"
            />
            <p className="mt-4 font-light">Loading…</p>
        </div>
    )
}

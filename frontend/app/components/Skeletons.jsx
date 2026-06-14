/**
 * Shimmer skeletons for the products grid and filters panel (Task 3).
 *
 * Shapes/spacing mirror the real components so there's no layout shift when the
 * data arrives. The shimmer animation is defined in globals.css (.skeleton).
 */

function Bar({ className = '' }) {
    return <div className={`skeleton rounded-md ${className}`} />
}

/** A single product card skeleton — matches ProductImage + ProductCardDetails. */
export function ProductCardSkeleton() {
    return (
        <div className="w-full flex flex-col gap-3">
            <Bar className="w-full min-h-48 h-48 rounded-lg" />
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-2 grow">
                    <Bar className="h-5 w-2/3" />
                    <Bar className="h-4 w-1/2" />
                </div>
                <Bar className="h-5 w-10" />
            </div>
            <Bar className="h-6 w-24" />
        </div>
    )
}

/** Grid of product card skeletons. */
export function ProductsGridSkeleton({ count = 6 }) {
    return (
        <div className="products grid grid-cols-1 xl:grid-cols-3 gap-x-6 gap-y-20 xl:gap-y-10">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}

/** Filters panel skeleton — matches the Filters groups (title + rows). */
export function FiltersSkeleton() {
    return (
        <div className="col-span-0 xl:col-span-2 hidden xl:flex flex-col gap-6">
            <div className="flex pb-2 border-b border-gray-500 h-10 items-center justify-between">
                <Bar className="h-5 w-20" />
            </div>
            {Array.from({ length: 4 }).map((_, g) => (
                <div key={g} className="flex flex-col gap-3">
                    <Bar className="h-5 w-28" />
                    <div className="flex flex-col gap-2 pl-1">
                        {Array.from({ length: 4 }).map((_, r) => (
                            <div key={r} className="flex items-center gap-2">
                                <Bar className="h-4 w-4 rounded" />
                                <Bar className="h-4" style={{ width: `${50 + ((r * 13) % 35)}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ProductsGridSkeleton

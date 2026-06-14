/**
 * White rounded card used on the product detail page. Height fits its content
 * (no fixed/min height). The first card overlaps the page banner via the
 * default negative top margin; pass `overlap={false}` for stacked cards below it.
 */
function ProductViewContainer({ children, classes = '', overlap = true }) {
    return (
        <div
            className={`${classes} product-view-container ${overlap ? '-mt-20' : ''} p-6 xl:p-8 bg-white shadow-2xl rounded-2xl w-full h-fit overflow-hidden`}
        >
            {children}
        </div>
    )
}

export default ProductViewContainer

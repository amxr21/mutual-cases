
function ProductViewContainer({ children, classes }) {
    return (
        <div className={`${classes} product-view-container -mt-20 p-6 xl:p-8  bg-white shadow-2xl rounded-2xl w-full min-h-[20rem] overflow-hidden`}>
            {children}
        </div>
    )
}

export default ProductViewContainer;
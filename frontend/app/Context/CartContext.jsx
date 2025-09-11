const { createContext, useState } = require("react");

const CartContext = createContext();

const CartContextWrapper = ({ children }) => {
    const [ cartDetails, setCartDetails ] = useState({ cartItems: {}, requests: { gift: false, note: '' } })


    return (
        <CartContext.Provider value={{ cartDetails, setCartDetails }}>
            {children}
        </CartContext.Provider>
    )
}


export { CartContextWrapper, CartContext };
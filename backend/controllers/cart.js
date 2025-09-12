const pool = require('../db');

let sql = 
        `
            INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?);
        `

const addToCart = async (req, res) => {
    try {
        const { user_id, product_id, quantity } = req.body

        const [ exisiting ] = await pool.query(`SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`, [user_id, product_id])
        
        if(exisiting.length > 0){
            return res.json({message: "Item already in cart", itemStatus: "exists"})
        }

        const [ rows ] = await pool.query(sql, [user_id, product_id, quantity])  

        res.json({ message: "Item added to cart", itemStatus: "added", data: rows })
        // if(rows.affectedRows == 0){
        //     res.json({message: "Item already in cart", itemStatus: "added"})
        // }


    } catch (error) {
        console.log(error);
        res.json({error})
        
    }
    
}

const removeFromCart = async (req, res) => {
    try {
        const { product_id } = req.body;
        
        const sql = `DELETE FROM cart_items WHERE product_id = ${product_id} `
        const [ rows ] = await pool.query(sql);

        res.json(rows)

        
    } catch (error) {
        console.log(error);
        res.json({error})
    }
}

const updateCart = async (req, res) => {
    const { id, quantity } = req.body
    console.log(req.body);
    
    
    // console.log(cartItem);
    

    const [ rows ] = await pool.query(`UPDATE cart_items SET quantity = ${quantity} WHERE product_id = ${id}`)
    try {
        // UPDATE table_name SET col1 = val1 WHERE condition;
        if(rows){
            res.json({message: "Item updated", itemStatus: 'updated', data: rows})
        }
        else{
            console.log(rows);
            
            // throw Error("Item is not updated")
        }
        
    } catch (error) {
        res.json({message: "Item isnt updated", itemStatus: 'no-change', data: rows})
    }
}

const viewCart = async (req, res) => {
    try {
        const { id } = req.params
        console.log(id);
        
        // const [ rows ] = await pool.query('SELECT * FROM cart_items WHERE user_id = ?', [ id ])
        const [ rows ] = await pool.query(
            `
            SELECT ci.id, ci.quantity, ci.added_at, p.id, p.price, p.model, p.edition, p.category, p.stock_quantity_id, p.image_url_1, t.type, ci.quantity FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            JOIN types t ON t.id = p.type_id
            JOIN stock_quantity sq ON sq.stock_id = p.stock_quantity_id
            WHERE ci.user_id = ${id}
            `

        )

        res.json(rows)


    } catch (error) {
        res.json(error)   
    }
}




module.exports = {
    addToCart,
    viewCart,
    removeFromCart,
    updateCart
}
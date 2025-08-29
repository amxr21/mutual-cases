// db connection pool
const pool = require("../db")

const _ = require("lodash");

// let sql = 
// `
//     SELECT p.id,  p.trend, p.category, p.model, t.type, p.price, p.stock_quantity_id, sq.quantity,  p.created_at, p.updated_at FROM products p 
//     JOIN stock_quantity sq
//         ON p.stock_quantity_id = sq.stock_id
//     JOIN types t
//         ON p.type_id = t.id
let sql = 
`
    SELECT p.id,  p.trend, p.edition, p.category, p.model, t.type, p.price, p.stock_quantity_id, sq.quantity, p.image_url_1, p.image_url_2, p.image_url_3,  p.created_at, p.updated_at FROM products p 
    JOIN CATEGORY c
        ON p.category = c.category_title
    JOIN stock_quantity sq
        ON p.stock_quantity_id = sq.stock_id
    JOIN types t
        ON p.type_id = t.id
`
const getProducts = async (req, res) => {

    try {
        const [ rows, fields ] = await pool.query(sql);
        console.log(rows);
        
        res.json(rows)

        
    } catch (error) {
        res.json({ error: error.message })
    }
}



const getProduct = async (req, res) => {
    const { id } = req.params;

    try {
        
        const [ result ] = await pool.query(sql);
    
        
        let filteredResults = await result.filter(r => r.id == id)
        
        if(filteredResults.length){
            res.json(filteredResults[0]);
        }
        else{
            res.json({message: "No such an id exist"});
        }
        
    } catch (error) {
        
        res.json(error)
        
    }






}



const getId = async (type, value) => {
    const stringedValue = String(value).toLowerCase();

    // Helper to query or insert if missing, return id
    const findOrInsert = async (tableName, columnName, val) => {
        const [ rows ] = await pool.query( `SELECT id FROM ${tableName} WHERE ${columnName} = ?`, [val] );

        if (rows.length === 0) {
            const [ insertResult ] = await pool.query(`INSERT INTO ${tableName} (${columnName}) VALUES (?)`,[val]);
            return insertResult.insertId;
        }
        return rows[0].id;
    };



        if (type === 'category') { 
            const categoryMap = { ipad: 1, iphone: 2, 'special items': 3 };
            if (categoryMap[stringedValue]) return categoryMap[stringedValue]; 
            return await findOrInsert('category', 'category_title', stringedValue);
        }
        else if (type === 'model') {
            // Option 1: fallback to hardcoded map:
            // const modelMap = {
            //     '13': 1, '13 mini': 2, '13 pro': 3, '13 pro max': 4,
            //     '14': 5, '14 plus': 6, '14 pro': 7, '14 pro max': 8,
            //     '15': 9, '15 plus': 10, '15 pro': 11, '15 pro max': 12,
            //     '16': 13, '16 plus': 14, '16 pro': 15, '16 pro max': 16,
            //     'm1': 17, 'm3': 18, 'm4': 19, 'm5': 20, 'm6': 21, 'm7': 22
            // };
            // if (modelMap[stringedValue]) return modelMap[stringedValue];
            // // Or fallback to DB:
            return await findOrInsert('model', 'model_type', stringedValue);
        }
        else if (type === 'edition') {
            return await findOrInsert('edition', 'edition_design', stringedValue);
        }
        else if (type === 'type') {
            const typeMap = {
                'normal': 1, '3d design': 2, 'simple': 3, 'light': 4, 'magnet': 5
            };
            if (typeMap[stringedValue]) return typeMap[stringedValue];
            return await findOrInsert('types', 'type', stringedValue);
        } 
        else {
            return 0;
        }
};

const postProduct = async (req, res) => {


    
    const { trend, price, model, edition, category, type, quantity, image_url_1, image_url_2, image_url_3 } = req.body

    try {
        
        let generated_stock_id = Math.floor(Math.random() * 100000)

        const sql = 
        `
            INSERT INTO products 
            (trend, price, model, edition, category, stock_quantity_id, type_id, image_url_1, image_url_2, image_url_3) 
            VALUES( ${trend}, ${price}, '${String(model).toLowerCase()}', '${String(edition).toLowerCase()}' ,'${String(category).toLowerCase()}', ${generated_stock_id}, ${await getId('type', type)}, '${image_url_1}', '${image_url_2}', '${image_url_3}');
        `

        const [ result, fields ] = await pool.query(sql);

        
        const sql2 = 
        `
            INSERT INTO stock_quantity
            (edition_id, model_id,  category_id, quantity, stock_id) 
            VALUES ( ${await getId('edition', edition)}, ${await getId('model', model)}, ${await getId('category', category)}, ${quantity}, ${generated_stock_id} )
        `

        await pool.query(sql2);



        res.status(200).json(result)
        
    } catch (error) {
        console.log(error);
        res.json(error)
        
    }
}


const updateProduct = async (req, res) => {
    const { id } = req.params;
    
    const [ result ] = await pool.query(sql);
    
    let product = result.filter(s => s?.id == id)
    
    // console.log(product);
    

    // if it exists 
    if(product.length){        
        try {
            const difference = Object.keys(_.pickBy(product[0], (value, key) => !_.isEqual(value, req?.body[key])))?.filter(d => d != 'created_at' && d != 'updated_at' && d != 'stock_quantity_id' )
            
            console.log("--------------------------------------------", difference, "--------------------------------------------");
            
            difference.map(async (d) => {
                let a = `UPDATE`
                switch(d){
                    case 'price': 
                        a += ` products SET ${d} = ${req.body[d]} `
                        break;
                        
                    case 'trend':    
                        a += ` products SET ${d} = ${req.body[d]} `
                        break;
                    
                    case 'model':
                        a += ` products SET ${d} = '${`${req.body[d]}`}' `
                        break;
                        
                    case 'category_title':
                        a += ` category SET ${d} = ${await getId('category', req.body[d])} `
                        break;
                        
                    case 'edition_design':
                        a += ` products SET edition_id = ${await getId('edition', req.body[d])} `
                        break;
                        
                    // case 'type':
                    //     a += ` types SET ${d} = ${await getId('type', req.body[d])} `
                    //     break;
                    case 'type':
                        const typeId = await getId('type', req.body[d]);
                        a += ` products SET type_id = ${typeId} `;
                        break;

    
                    case 'quantity':
                        a += ` stock_quantity SET quantity = ${req.body[d]}`
                        break;

                    case 'image_url_1':
                        a += ` products SET image_url_1 = "${req.body[d]}"`
                        break;

                    case 'image_url_2':
                        a += ` products SET image_url_2 = "${req.body[d]}"`
                        break;

                    case 'image_url_3':
                        a += ` products SET image_url_3 = "${req.body[d]}"`
                        break;
                    
                    default: 
                        console.log("erorr");
                        break
                            
    
    
                }
                // console.log(product[0].stock_quantity_id);
                
                a += ` WHERE ${d != 'quantity' ? 'id' : 'stock_id'} = ${d != 'quantity' ? id : product[0].stock_quantity_id};`
        
                console.log(a,"-------------", d);
                
                try {
                    await pool.query(a); 
                    // console.log(results);
                    // return res.json(results)
                    
                } catch (error) {
                    console.log(error);
                    
                    // res.json({error})
                }
            })
            res.status(200).json({message: 'update has been applied successfully'})
            
            

        } catch (error) {
            console.log("not found");
            res.json({message: 'update has been applied successfully'});
        }


        
    }

    else{
        console.log('failed');
        res.json({error: 'no such an id exists'})
        
    }

    
}


const deleteProduct = async (req, res) => {
    const { id } = req.params;

    const deleteSql = ` DELETE FROM products WHERE id = ${id} `;

    try {
        const [ result ] = await pool.query(deleteSql);
        console.log(result);
        
        
        res.status(200).json({result, message: 'product has been deleted'})


    } catch (error) {
        res.status(404).json({error})
    }

}








const test = async (req, res) => {
    
    try {
        const testSql = 
        `
            SELECT * FROM edition ;
        `
        const [ results, fields ] = await pool.query(testSql);
        console.log(results, fields);
    
        if(!results.length){
            res.json({message: "No such an id exist"});
        }
        else{
            res.json(results.map(r => r.edition_design.toLowerCase()))

        }


        
    } catch (error) {
        res.json({error})
    }



}



module.exports = {
    getProducts,
    postProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    test

}
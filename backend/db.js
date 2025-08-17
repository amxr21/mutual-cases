require("dotenv").config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 25,
    decimalNumbers: true,
    multipleStatements: true,
    queueLimit: 100,
    typeCast: ( field, next ) => {
        if(field.type == 'TINY' && field.length == 1){
            return field.string() == '1';
        }
        return next()
    }
})

 


module.exports = pool
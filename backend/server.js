require("dotenv").config()
const exprees = require('express');
// routes 
const productsRoutes = require("./routes/productsRoutes.js");

const app = exprees()



// middleware to accept json-format files
app.use(exprees.json());

// to keep following on req method and path taken
app.use((req, res, next) => {
    console.log(req.method, req.path); 
    next();
})

app.get("/", async (req, res) => {
    res.json({'test': "this is just a test"})
})

// products routes 
app.use("/products", productsRoutes)




app.listen(process.env.PORT, () => {
    console.log("Server works fine on", process.env.PORT);
    
})
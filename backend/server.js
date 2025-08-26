require("dotenv").config()
const exprees = require('express');
const cors = require('cors')
// routes 
const productsRoutes = require("./routes/productsRoutes.js");

const app = exprees()
const allowedOrigins = ["http://localhost:3001", "https://example.com"];

const corsOptions = {
//   origin:  allowedOrigins, // or '*' if open access is OK
  origin:  '*', // or '*' if open access is OK
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};

app.use(cors(corsOptions))

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
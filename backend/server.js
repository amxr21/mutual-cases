require("dotenv").config()
const express = require('express');
const cors = require('cors')
// routes 
const productsRoutes = require("./routes/productsRoutes.js");
const authRouter = require("./routes/googleRoutes.js");

const app = express()
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "https://mutual-cases.vercel.app", "https://mutual-cases.onrender.com"];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
}));

// app.use(cors(corsOptions))

// middleware to accept json-format files
app.use(express.json());

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


app.use("/", authRouter);




app.listen(process.env.PORT, () => {
    console.log("Server works fine on", process.env.PORT);
    
})
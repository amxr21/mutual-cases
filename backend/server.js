const express = require("express");
const cors = require("cors");

const config = require("./config");
const logger = require("./logger");
const { ping } = require("./dbClient");
const requestLogger = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const registerProcessHandlers = require("./process/handlers");

// Routes
const productsRoutes = require("./routes/productsRoutes.js");
const authRouter = require("./routes/googleRoutes.js");
const cartRouter = require("./routes/cartRoutes.js");
const likedRouter = require("./routes/likedRoutes.js");
const customRouter = require("./routes/customRoutes.js");
const ordersRouter = require("./routes/ordersRoutes.js");
const adminRouter = require("./routes/adminRoutes.js");

// --- Fail fast on missing critical configuration --------------------------
const missingEnv = config.validate();
if (missingEnv.length) {
    logger.error("Missing required environment variables", { missing: missingEnv });
    // Without DB creds / JWT secret the app can't function; refuse to start.
    process.exit(1);
}

const app = express();

const corsOptions = {
    origin: config.server.allowedOrigins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};
app.use(cors(corsOptions));

app.use(express.json());

// Structured request/response logging -> api-*.log.
app.use(requestLogger);

// Health check (also verifies DB connectivity).
app.get("/health", async (_req, res) => {
    try {
        await ping();
        res.json({ status: "ok", db: "up" });
    } catch {
        res.status(503).json({ status: "degraded", db: "down" });
    }
});

app.get("/", (_req, res) => {
    res.json({ status: "ok", service: "mutual-backend" });
});

// Feature routes.
app.use("/products", productsRoutes);
app.use("/cart", cartRouter);
app.use("/liked", likedRouter);
app.use("/custom", customRouter);
app.use("/orders", ordersRouter);
app.use("/admin", adminRouter);
app.use("/", authRouter);

// 404 for anything unmatched, then the centralized error handler. Order matters:
// these must be registered AFTER all routes.
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.server.port, () => {
    logger.info(`Server listening on port ${config.server.port}`, { env: config.env });
});

// Process-level safety net + graceful shutdown (drains server + DB pool).
registerProcessHandlers({ server, pool: require("./db") });

module.exports = app;

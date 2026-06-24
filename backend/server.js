const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
const reviewsRouter = require("./routes/reviewsRoutes.js");
const settingsRouter = require("./routes/settingsRoutes.js");
const deliveryRouter = require("./routes/deliveryRoutes.js");
const returnsRouter = require("./routes/returnsRoutes.js");
const discountsRouter = require("./routes/discountsRoutes.js");

// --- Fail fast on missing critical configuration --------------------------
const missingEnv = config.validate();
if (missingEnv.length) {
    logger.error("Missing required environment variables", { missing: missingEnv });
    // Without DB creds / JWT secret the app can't function; refuse to start.
    process.exit(1);
}

const app = express();

// Render/Vercel sit behind a proxy; trust it so req.ip (used by rate limiting
// and logging) reflects the real client, not the load balancer.
app.set("trust proxy", 1);

// Security headers. This service is a JSON API consumed by a separate frontend
// origin, so the browser never renders HTML from it — CSP/CORP defaults that
// assume a served document would only get in the way. We keep the protective
// headers (nosniff, frame-ancestors via frameguard, HSTS, referrer policy) and
// drop the document-oriented ones.
app.use(
    helmet({
        contentSecurityPolicy: false, // no HTML served from the API
        crossOriginResourcePolicy: false, // allow the cross-origin frontend to read responses
    })
);

const corsOptions = {
    origin: config.server.allowedOrigins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};
app.use(cors(corsOptions));

// Abuse protection. A broad limiter on everything, plus a stricter one on the
// auth endpoint (the most attractive brute-force / spam target). Limits are per
// IP; health checks are exempt so uptime probes don't eat the budget.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
    message: { error: { message: "Too many requests, please try again later.", code: "RATE_LIMITED" } },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: "Too many login attempts, please try again later.", code: "RATE_LIMITED" } },
});

app.use(generalLimiter);

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
app.use("/reviews", reviewsRouter);
app.use("/settings", settingsRouter);
app.use("/delivery", deliveryRouter);
app.use("/returns", returnsRouter);
app.use("/discounts", discountsRouter);
app.use("/api/auth", authLimiter);
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

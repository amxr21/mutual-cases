/**
 * JWT authentication middleware.
 *
 * Verifies the Bearer token issued at login (googleRoutes) and attaches the
 * decoded user to req.user. Protected routes use this so the server derives the
 * acting user from the *token*, never from a client-supplied user_id — closing
 * the hole where anyone could pass another user's id to read/modify their data.
 *
 *   router.post("/", requireAuth, asyncHandler(handler))
 *   // handler reads req.user.id  (do NOT trust req.body.user_id)
 */
const jwt = require("jsonwebtoken");
const config = require("../config");
const { query } = require("../dbClient");
const { unauthorized, forbidden } = require("../errors/AppError");

const requireAuth = (req, _res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return next(unauthorized("Authentication required"));
    }

    try {
        const payload = jwt.verify(token, config.auth.jwtSecret);
        // payload = { id, email, role } as signed in googleRoutes.
        req.user = { id: payload.id, email: payload.email, role: payload.role || "customer" };
        return next();
    } catch {
        return next(unauthorized("Your session has expired. Please sign in again."));
    }
};

/**
 * Admin gate. Runs requireAuth first, then re-checks the role against the DB
 * (so a demoted user can't keep admin access via an old token, and a forged
 * role claim is meaningless). Use on all /admin routes.
 */
const requireAdmin = (req, res, next) => {
    requireAuth(req, res, async (err) => {
        if (err) return next(err);
        try {
            const rows = await query("SELECT role FROM users WHERE id = ?", [req.user.id], {
                op: "requireAdmin",
            });
            if (!rows.length || rows[0].role !== "admin") {
                return next(forbidden("Admin access required"));
            }
            req.user.role = "admin";
            return next();
        } catch (e) {
            return next(e);
        }
    });
};

/**
 * Delivery gate. Like requireAdmin but for the delivery portal — re-checks the
 * role against the DB so only current delivery staff can use driver routes.
 */
const requireDelivery = (req, res, next) => {
    requireAuth(req, res, async (err) => {
        if (err) return next(err);
        try {
            // Re-check role AND availability from the DB so a deactivated driver
            // (status='inactive', set by admin) can't keep using their token.
            const rows = await query(
                `SELECT u.role, d.status
                 FROM users u LEFT JOIN delivery_profiles d ON d.user_id = u.id
                 WHERE u.id = ?`,
                [req.user.id],
                { op: "requireDelivery" }
            );
            if (!rows.length || rows[0].role !== "delivery") {
                return next(forbidden("Delivery access required"));
            }
            if (rows[0].status === "inactive") {
                return next(forbidden("Your delivery account is inactive. Contact your admin."));
            }
            req.user.role = "delivery";
            return next();
        } catch (e) {
            return next(e);
        }
    });
};

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireDelivery = requireDelivery;

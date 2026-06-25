/**
 * Google OAuth login route.
 *
 * Verifies the Google ID token (with a timeout so a slow Google response can't
 * tie up the request indefinitely), upserts the user, and issues an app JWT.
 * Uses validate + asyncHandler; failures flow through the central error handler.
 */
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const config = require("../config");
const { query } = require("../dbClient");
const asyncHandler = require("../middleware/asyncHandler");
const validate = require("../middleware/validate");
const { authSchema } = require("../validation/schemas");
const { unauthorized, serviceUnavailable } = require("../errors/AppError");
const { requireAuth } = require("../middleware/auth");
const { record } = require("../audit");
const logger = require("../logger");

const router = express.Router();
const client = new OAuth2Client(config.auth.googleClientId);

/** Reject the verify call if Google takes longer than the configured timeout. */
const verifyWithTimeout = (idToken) => {
    const timeoutMs = config.auth.googleVerifyTimeoutMs;
    return Promise.race([
        client.verifyIdToken({ idToken, audience: config.auth.googleClientId }),
        new Promise((_, reject) =>
            setTimeout(() => reject(serviceUnavailable("Google verification timed out")), timeoutMs)
        ),
    ]);
};

router.post(
    "/api/auth",
    validate({ body: authSchema }),
    asyncHandler(async (req, res) => {
        const { id_token } = req.body;

        let payload;
        try {
            const ticket = await verifyWithTimeout(id_token);
            payload = ticket.getPayload();
        } catch (err) {
            // Distinguish "bad token" (401) from "Google unreachable/timeout" (503).
            if (err && err.status === 503) throw err;
            logger.warn("Google token verification failed", { message: err?.message });
            throw unauthorized("Google login failed");
        }

        const { sub: googleId, email, name, picture } = payload;

        const existing = await query("SELECT * FROM users WHERE google_id = ?", [googleId], {
            op: "auth.findUser",
        });

        let user;
        if (existing.length) {
            user = existing[0];
        } else {
            // No google_id match — but an admin may have pre-created an account by
            // email (e.g. a staff member). Adopt that record on first sign-in so
            // their pre-assigned role/staff_role carries over (and no duplicate is
            // created). Otherwise create a fresh customer.
            const byEmail = await query("SELECT * FROM users WHERE email = ?", [email], {
                op: "auth.findByEmail",
            });
            if (byEmail.length) {
                await query(
                    "UPDATE users SET google_id = ?, name = COALESCE(NULLIF(name,''), ?), profile_picture = ? WHERE id = ?",
                    [googleId, name, picture, byEmail[0].id],
                    { op: "auth.linkByEmail" }
                );
                user = { ...byEmail[0], google_id: googleId, picture };
            } else {
                const result = await query(
                    "INSERT INTO users (google_id, name, email, profile_picture) VALUES (?, ?, ?, ?)",
                    [googleId, name, email, picture],
                    { op: "auth.createUser" }
                );
                user = { id: result.insertId, google_id: googleId, email, name, picture, role: "customer" };
            }
        }

        const role = user.role || "customer";

        // Role is included in the signed token so the server can authorize admin
        // routes from a verified claim (and we re-check the DB on admin actions).
        const token = jwt.sign({ id: user.id, email: user.email, role }, config.auth.jwtSecret, {
            expiresIn: config.auth.jwtExpiresIn,
        });

        // Activity log: record the sign-in (who + which role). Best-effort.
        record({ userId: user.id, userName: user.email, action: "auth.login", entity: "user", entityId: user.id, detail: `role=${role}` });

        res.json({ success: true, token, name, email, picture, userId: user.id, role });
    })
);

/**
 * POST /api/auth/logout — records a sign-out in the activity log. JWTs are
 * stateless so there's no server session to destroy; the client discards the
 * token. Auth is required so we log the real actor from their token.
 */
router.post(
    "/api/auth/logout",
    requireAuth,
    asyncHandler(async (req, res) => {
        record({ userId: req.user.id, userName: req.user.email, action: "auth.logout", entity: "user", entityId: req.user.id });
        res.json({ success: true });
    })
);

module.exports = router;

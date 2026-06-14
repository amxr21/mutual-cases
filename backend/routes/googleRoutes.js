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
        if (!existing.length) {
            const result = await query(
                "INSERT INTO users (google_id, name, email, profile_picture) VALUES (?, ?, ?, ?)",
                [googleId, name, email, picture],
                { op: "auth.createUser" }
            );
            user = { id: result.insertId, google_id: googleId, email, name, picture, role: "customer" };
        } else {
            user = existing[0];
        }

        const role = user.role || "customer";

        // Role is included in the signed token so the server can authorize admin
        // routes from a verified claim (and we re-check the DB on admin actions).
        const token = jwt.sign({ id: user.id, email: user.email, role }, config.auth.jwtSecret, {
            expiresIn: config.auth.jwtExpiresIn,
        });

        res.json({ success: true, token, name, email, picture, userId: user.id, role });
    })
);

module.exports = router;

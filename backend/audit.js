/**
 * Activity / audit log recorder.
 *
 * A single best-effort writer used across the app to record who did what and
 * when — sign-in/out, and every admin create/update/delete/status change. It
 * NEVER throws into the request path: a failed audit write is logged and
 * swallowed so it can't break the actual operation.
 *
 * Two entry points:
 *   - record({ userId, userName, action, entity, entityId, detail })
 *       low-level; used where there's no Express req (e.g. the auth route).
 *   - audit(req, action, opts)
 *       convenience wrapper that pulls the actor from req.user.
 */
const { query } = require("./dbClient");
const logger = require("./logger");

async function record({ userId = null, userName = null, action, entity = null, entityId = null, detail = null } = {}) {
    try {
        await query(
            "INSERT INTO audit_log (user_id, user_name, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?, ?)",
            [
                userId != null ? String(userId) : null,
                userName,
                action,
                entity,
                entityId != null ? String(entityId) : null,
                detail != null ? String(detail).slice(0, 500) : null,
            ],
            { op: "audit" }
        );
    } catch (err) {
        logger.error("audit failed", { action, message: err?.message });
    }
}

/** Record an admin action, deriving the actor from req.user. */
async function audit(req, action, opts = {}) {
    return record({
        userId: req?.user?.id ?? null,
        userName: req?.user?.email ?? null,
        action,
        ...opts,
    });
}

module.exports = { record, audit };

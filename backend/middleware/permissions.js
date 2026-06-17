/**
 * Granular admin permissions.
 *
 * Every admin user already passes requireAdmin (role='admin'); this layer adds a
 * finer staff_role that scopes which areas they can WRITE to. Reads stay open to
 * any admin; writes are gated per-permission.
 *
 *   owner       — everything
 *   manager     — everything except managing admin users/roles
 *   fulfillment — orders, delivery, inventory, returns
 *   support     — reviews, customers (edit), returns
 *
 * Permission keys are coarse areas, checked at write routes via requirePermission.
 */
const { query } = require("../dbClient");
const { forbidden } = require("../errors/AppError");

const PERMISSIONS = {
    owner: ["*"],
    manager: ["orders", "products", "inventory", "delivery", "returns", "reviews", "customers", "discounts", "settings", "reports"],
    fulfillment: ["orders", "delivery", "inventory", "returns"],
    support: ["reviews", "customers", "returns", "orders"],
};

/** Does a staff role hold a permission? */
function can(staffRole, permission) {
    const perms = PERMISSIONS[staffRole] || [];
    return perms.includes("*") || perms.includes(permission);
}

/**
 * requirePermission(area) — middleware factory. Assumes requireAdmin already ran
 * (so req.user is an admin). Loads the user's staff_role from the DB and checks.
 * Owner (or a NULL staff_role on a legacy admin) is treated as full access.
 */
const requirePermission = (area) => async (req, res, next) => {
    try {
        const rows = await query("SELECT staff_role FROM users WHERE id = ?", [req.user.id], {
            op: "requirePermission",
        });
        const staffRole = rows.length ? rows[0].staff_role || "owner" : "owner";
        req.user.staffRole = staffRole;
        if (!can(staffRole, area)) {
            return next(forbidden(`Your role can't perform this action (${area})`));
        }
        return next();
    } catch (e) {
        return next(e);
    }
};

module.exports = { PERMISSIONS, can, requirePermission };

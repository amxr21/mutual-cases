/**
 * Granular admin permissions.
 *
 * Every admin user already passes requireAdmin (role='admin'); this layer adds a
 * finer staff_role that scopes which areas they can WRITE to. Reads stay open to
 * any admin; writes are gated per-permission.
 *
 *   owner       — everything, including managing owner/developer accounts
 *   developer   — everything (full operational + technical: settings,
 *                 integrations, every module) EXCEPT managing owner/developer
 *                 accounts, so a developer can never lock the owner out
 *   manager     — everything except staff/role management
 *   fulfillment — orders, delivery, inventory, returns
 *   support     — reviews, customers (edit), returns
 *
 * Permission keys are coarse areas, checked at write routes via requirePermission.
 *
 * NOTE on 'staff': both owner and developer can manage staff (add members, set
 * roles). A separate governance rail (canManageOwners) reserves creating or
 * demoting OWNER/DEVELOPER accounts to owners only — so a developer can manage
 * manager/fulfillment/support staff, but not other owners or developers.
 */
const { query } = require("../dbClient");
const { forbidden } = require("../errors/AppError");

// Roles with full, owner-equivalent capability across all feature areas.
const FULL_ACCESS_ROLES = new Set(["owner", "developer"]);
// Roles permitted to create/demote owner & developer accounts (governance rail).
const OWNER_GOVERNANCE_ROLES = new Set(["owner"]);

const PERMISSIONS = {
    owner: ["*"],
    developer: ["*"],
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
 * Governance rail: may an actor with `actorRole` create, modify, or demote an
 * account whose role is (or is becoming) an owner/developer? Reserved to owners.
 * Lower staff roles (manager/fulfillment/support) are managed by anyone holding
 * the 'staff' permission.
 */
function canManageOwners(actorRole) {
    return OWNER_GOVERNANCE_ROLES.has(actorRole);
}

/** Is this a full-access (owner-equivalent) role? */
function isFullAccess(staffRole) {
    return FULL_ACCESS_ROLES.has(staffRole);
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

module.exports = { PERMISSIONS, can, requirePermission, canManageOwners, isFullAccess, FULL_ACCESS_ROLES };

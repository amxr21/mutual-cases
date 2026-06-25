/**
 * Admin staff & audit-log controllers.
 *
 * - List admin staff + set their staff_role (owner-gated via requirePermission
 *   on the route).
 * - Read the audit log.
 *
 * `audit()` is a best-effort recorder other controllers can call to log an
 * admin action; it never throws into the request.
 */
const { query } = require("../dbClient");
const { badRequest, notFound, conflict, forbidden } = require("../errors/AppError");
const { canManageOwners } = require("../middleware/permissions");
const { audit } = require("../audit");

const STAFF_ROLES = new Set(["owner", "developer", "manager", "fulfillment", "support"]);
// Privileged roles whose accounts only an owner may create, change, or demote.
const PRIVILEGED_ROLES = new Set(["owner", "developer"]);

/** GET /admin/staff — list admin users + their staff role. */
const listStaff = async (_req, res) => {
    const rows = await query(
        "SELECT id, name, email, staff_role, created_at FROM users WHERE role = 'admin' ORDER BY created_at",
        [],
        { op: "admin.listStaff" }
    );
    res.json(rows.map((r) => ({ ...r, staff_role: r.staff_role || "owner" })));
};

/**
 * POST /admin/staff — add an admin staff member by email + role (owner-only).
 * If a user with that email already exists, they're promoted to admin with the
 * given staff role; otherwise a pending admin record is created so they get
 * admin access the moment they sign in with Google using that email.
 */
const createStaff = async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.staff_role || "").toLowerCase();
    if (!name) throw badRequest("Name is required");
    if (!STAFF_ROLES.has(role)) throw badRequest("Invalid staff role");

    // Governance rail: only an owner may create an owner or developer account.
    // req.user.staffRole is loaded by requirePermission("staff") on the route.
    if (PRIVILEGED_ROLES.has(role) && !canManageOwners(req.user.staffRole)) {
        throw forbidden("Only an owner can add an owner or developer");
    }

    const existing = await query("SELECT id, role FROM users WHERE email = ?", [email]);
    if (existing.length) {
        // Promote the existing account to admin with this staff role.
        await query("UPDATE users SET role = 'admin', staff_role = ?, name = ? WHERE id = ?", [
            role,
            name,
            existing[0].id,
        ]);
        await audit(req, "staff.add", { entity: "user", entityId: existing[0].id, detail: `${email} → ${role} (existing)` });
        return res.status(200).json({ id: existing[0].id, message: "Existing user promoted to admin" });
    }

    // Create a pending admin (no google_id yet — set on first Google sign-in by
    // matching email; a synthetic placeholder satisfies the NOT NULL/UNIQUE).
    const googleId = `pending-admin-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const ins = await query(
        "INSERT INTO users (google_id, name, email, role, staff_role) VALUES (?, ?, ?, 'admin', ?)",
        [googleId, name, email, role]
    );
    await audit(req, "staff.add", { entity: "user", entityId: ins.insertId, detail: `${email} → ${role}` });
    res.status(201).json({ id: ins.insertId, message: "Staff member added" });
};

/** PATCH /admin/staff/:id/role — set a staff member's role (owner-only route). */
const setStaffRole = async (req, res) => {
    const id = Number(req.params.id);
    const role = String(req.body.staff_role || "").toLowerCase();
    if (!STAFF_ROLES.has(role)) throw badRequest("Invalid staff role");

    const target = await query("SELECT staff_role FROM users WHERE id = ? AND role = 'admin'", [id]);
    if (!target.length) throw notFound("Staff member not found");
    const currentRole = target[0].staff_role || "owner";

    // Governance rail: only an owner may set a role TO owner/developer, or change
    // the role of an account that is currently an owner/developer (demotion).
    const touchesPrivileged = PRIVILEGED_ROLES.has(role) || PRIVILEGED_ROLES.has(currentRole);
    if (touchesPrivileged && !canManageOwners(req.user.staffRole)) {
        throw forbidden("Only an owner can change owner or developer roles");
    }

    // Don't allow demoting the last owner (so the store can't be orphaned).
    if (currentRole === "owner" && role !== "owner") {
        const [owners] = await query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND (staff_role = 'owner' OR staff_role IS NULL)");
        if (Number(owners.c) <= 1) throw badRequest("Cannot demote the last owner");
    }

    await query("UPDATE users SET staff_role = ? WHERE id = ?", [role, id], { op: "admin.setStaffRole" });
    await audit(req, "staff.role_change", { entity: "user", entityId: id, detail: `→ ${role}` });
    res.json({ message: "Staff role updated", staff_role: role });
};

/** GET /admin/audit-log — recent admin actions. */
const listAuditLog = async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await query(
        `SELECT id, user_name, action, entity, entity_id, detail, created_at
         FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ?`,
        [limit],
        { op: "admin.listAuditLog" }
    );
    res.json(rows);
};

module.exports = { listStaff, createStaff, setStaffRole, listAuditLog };

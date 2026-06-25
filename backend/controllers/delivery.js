/**
 * Delivery staff controllers (admin-managed).
 *
 * A delivery person is a `users` row with role='delivery' plus a 1:1
 * `delivery_profiles` row carrying logistics info (vehicle, coverage zone,
 * availability). Admins create/list/edit/delete them here. They're created
 * directly by an admin (not via Google sign-in), so we mint a synthetic unique
 * google_id to satisfy the NOT NULL/UNIQUE constraint.
 *
 * Mounted behind requireAdmin in adminRoutes.
 */
const { query, withTransaction } = require("../dbClient");
const { notFound, badRequest, conflict } = require("../errors/AppError");
const { audit } = require("../audit");

const SELECT = `
    SELECT u.id, u.name, u.email, u.phone, u.access_code, u.created_at,
           d.vehicle_type, d.plate_number, d.license_number,
           d.zone, d.emirate, d.country, d.status
    FROM users u
    JOIN delivery_profiles d ON d.user_id = u.id
    WHERE u.role = 'delivery'
`;

/** GET /admin/delivery — list all delivery staff with their profiles. */
const listDelivery = async (_req, res) => {
    const rows = await query(`${SELECT} ORDER BY u.created_at DESC`, [], { op: "admin.listDelivery" });
    res.json(rows);
};

/** GET /admin/delivery/:id — one delivery person. */
const getDelivery = async (req, res) => {
    const id = Number(req.params.id);
    const rows = await query(`${SELECT} AND u.id = ?`, [id], { op: "admin.getDelivery" });
    if (!rows.length) throw notFound("Delivery person not found");
    res.json(rows[0]);
};

/** POST /admin/delivery — create a delivery person (user + profile). */
const createDelivery = async (req, res) => {
    const { name, email, phone, vehicle_type, plate_number, license_number, zone, emirate, country, status } =
        req.body;

    // Guard duplicate email up front for a clean message.
    const existing = await query("SELECT id FROM users WHERE email = ?", [email], {
        op: "admin.createDelivery.checkEmail",
    });
    if (existing.length) throw conflict("A user with that email already exists");

    const googleId = `delivery-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const id = await withTransaction(async (tx) => {
        const u = await tx(
            "INSERT INTO users (google_id, name, email, role, phone) VALUES (?, ?, ?, 'delivery', ?)",
            [googleId, name, email, phone || null]
        );
        const userId = u.insertId;
        await tx(
            `INSERT INTO delivery_profiles
                (user_id, vehicle_type, plate_number, license_number, zone, emirate, country, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                vehicle_type || null,
                plate_number || null,
                license_number || null,
                zone || null,
                emirate || null,
                country || null,
                status || "active",
            ]
        );
        return userId;
    }, { op: "admin.createDelivery" });

    await audit(req, "delivery.create", { entity: "user", entityId: id, detail: email });
    res.status(201).json({ id, message: "Delivery person created" });
};

const USER_FIELDS = ["name", "email", "phone"];
const PROFILE_FIELDS = [
    "vehicle_type",
    "plate_number",
    "license_number",
    "zone",
    "emirate",
    "country",
    "status",
];

/** PATCH /admin/delivery/:id — update user + profile fields. */
const updateDelivery = async (req, res) => {
    const id = Number(req.params.id);

    const target = await query("SELECT id FROM users WHERE id = ? AND role = 'delivery'", [id], {
        op: "admin.updateDelivery.find",
    });
    if (!target.length) throw notFound("Delivery person not found");

    const userSet = [];
    const userParams = [];
    for (const f of USER_FIELDS) {
        if (f in req.body) {
            userSet.push(`\`${f}\` = ?`);
            userParams.push(f === "name" || f === "email" ? req.body[f] : req.body[f] === "" ? null : req.body[f]);
        }
    }

    const profSet = [];
    const profParams = [];
    for (const f of PROFILE_FIELDS) {
        if (f in req.body) {
            profSet.push(`\`${f}\` = ?`);
            profParams.push(req.body[f] === "" ? null : req.body[f]);
        }
    }

    if (!userSet.length && !profSet.length) throw badRequest("Provide at least one field to update");

    await withTransaction(async (tx) => {
        if (userSet.length) {
            await tx(`UPDATE users SET ${userSet.join(", ")} WHERE id = ?`, [...userParams, id]);
        }
        if (profSet.length) {
            await tx(`UPDATE delivery_profiles SET ${profSet.join(", ")} WHERE user_id = ?`, [
                ...profParams,
                id,
            ]);
        }
    }, { op: "admin.updateDelivery" });

    await audit(req, "delivery.update", { entity: "user", entityId: id, detail: [...userSet, ...profSet].map((s) => s.split(" ")[0].replace(/`/g, "")).join(",") });
    res.json({ message: "Delivery person updated" });
};

/** DELETE /admin/delivery/:id — remove a delivery person (profile cascades). */
const deleteDelivery = async (req, res) => {
    const id = Number(req.params.id);
    const result = await query("DELETE FROM users WHERE id = ? AND role = 'delivery'", [id], {
        op: "admin.deleteDelivery",
    });
    if (!result.affectedRows) throw notFound("Delivery person not found");
    await audit(req, "delivery.delete", { entity: "user", entityId: id });
    res.json({ message: "Delivery person deleted" });
};

// Unambiguous alphabet (no 0/O/1/I) for human-typeable access codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () =>
    Array.from({ length: 8 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

/** POST /admin/delivery/:id/access-code — (re)generate a driver's login code. */
const generateAccessCode = async (req, res) => {
    const id = Number(req.params.id);
    const target = await query("SELECT 1 FROM users WHERE id = ? AND role = 'delivery'", [id], {
        op: "admin.generateAccessCode.find",
    });
    if (!target.length) throw notFound("Delivery person not found");

    // Retry on the (very unlikely) unique-code collision.
    let code;
    for (let attempt = 0; attempt < 5; attempt++) {
        code = makeCode();
        try {
            await query("UPDATE users SET access_code = ? WHERE id = ?", [code, id], {
                op: "admin.generateAccessCode",
            });
            await audit(req, "delivery.access_code", { entity: "user", entityId: id });
            return res.json({ message: "Access code generated", access_code: code });
        } catch (err) {
            if (err && err.code === "CONFLICT") continue; // dup code, retry
            throw err;
        }
    }
    throw badRequest("Could not generate a unique code, please retry");
};

module.exports = {
    listDelivery,
    getDelivery,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    generateAccessCode,
};

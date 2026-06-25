/**
 * Shared test helpers.
 *
 * - tokenFor(): mint a valid app JWT so requireAuth passes for a given user.
 * - The DB is mocked at the dbClient seam in each suite via jest.mock("../dbClient").
 */
const jwt = require("jsonwebtoken");
const config = require("../config");

/** Sign a JWT exactly like googleRoutes does, so requireAuth accepts it. */
function tokenFor({ id = 1, email = "user@test.com", role = "customer" } = {}) {
    return jwt.sign({ id, email, role }, config.auth.jwtSecret, { expiresIn: "1h" });
}

/** Authorization header convenience. */
function authHeader(user) {
    return { Authorization: `Bearer ${tokenFor(user)}` };
}

module.exports = { tokenFor, authHeader };

/**
 * Access control / RBAC tests — the highest-risk area.
 *
 * Verifies that admin routes are gated server-side and that the owner-vs-
 * developer governance rail holds: only owners may create/demote owner or
 * developer accounts, while a developer (full access otherwise) cannot.
 *
 * The DB layer is mocked so we control exactly what role the server reads.
 */
jest.mock("../dbClient");

const request = require("supertest");
const createApp = require("../app");
const { query } = require("../dbClient");
const { authHeader } = require("./helpers");

const app = createApp({ rateLimit: false });

describe("admin route gating", () => {
    test("rejects an anonymous request with 401", async () => {
        const res = await request(app).get("/admin/overview");
        expect(res.status).toBe(401);
    });

    test("rejects a logged-in customer with 403", async () => {
        // requireAdmin re-reads the role from the DB; a customer row -> forbidden.
        query.mockResolvedValueOnce([{ role: "customer" }]);
        const res = await request(app)
            .get("/admin/overview")
            .set(authHeader({ id: 7, role: "customer" }));
        expect(res.status).toBe(403);
    });

    test("a forged admin claim is ignored — the DB role wins", async () => {
        // Token says role=admin, but the DB says customer -> still forbidden.
        query.mockResolvedValueOnce([{ role: "customer" }]);
        const res = await request(app)
            .get("/admin/overview")
            .set(authHeader({ id: 7, role: "admin" }));
        expect(res.status).toBe(403);
    });
});

describe("owner/developer governance rail (staff role changes)", () => {
    // PATCH /admin/staff/:id/role flow reads, in order:
    //   1) requireAdmin    -> SELECT role        (must be 'admin')
    //   2) requirePermission('staff') -> SELECT staff_role (actor's staff role)
    //   3) handler         -> SELECT staff_role FROM users WHERE id=? (target)
    //   ... then the UPDATE.
    function mockActor(staffRole) {
        query
            .mockResolvedValueOnce([{ role: "admin" }])      // requireAdmin
            .mockResolvedValueOnce([{ staff_role: staffRole }]); // requirePermission
    }

    test("a developer cannot promote someone to owner", async () => {
        mockActor("developer");
        query.mockResolvedValueOnce([{ staff_role: "manager" }]); // target currently manager
        const res = await request(app)
            .patch("/admin/staff/42/role")
            .set(authHeader({ id: 1, role: "admin" }))
            .send({ staff_role: "owner" });
        expect(res.status).toBe(403);
    });

    test("a developer cannot demote an existing owner", async () => {
        mockActor("developer");
        query.mockResolvedValueOnce([{ staff_role: "owner" }]); // target currently owner
        const res = await request(app)
            .patch("/admin/staff/42/role")
            .set(authHeader({ id: 1, role: "admin" }))
            .send({ staff_role: "manager" });
        expect(res.status).toBe(403);
    });

    test("an owner CAN change a manager to developer", async () => {
        mockActor("owner");
        query.mockResolvedValueOnce([{ staff_role: "manager" }]); // target currently manager
        query.mockResolvedValueOnce({ affectedRows: 1 });          // the UPDATE
        query.mockResolvedValueOnce({});                            // audit insert
        const res = await request(app)
            .patch("/admin/staff/42/role")
            .set(authHeader({ id: 1, role: "admin" }))
            .send({ staff_role: "developer" });
        expect(res.status).toBe(200);
        expect(res.body.staff_role).toBe("developer");
    });
});

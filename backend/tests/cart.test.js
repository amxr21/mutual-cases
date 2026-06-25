/**
 * Cart tests — covers the add-to-cart upsert (the fix for the global-unique
 * "That record already exists" bug) and the IDOR guarantee that a cart is
 * always scoped to the JWT user, never a client-supplied id.
 */
jest.mock("../dbClient");

const request = require("supertest");
const createApp = require("../app");
const { query } = require("../dbClient");
const { authHeader } = require("./helpers");

const app = createApp({ rateLimit: false });

describe("POST /cart (add to cart)", () => {
    test("inserting a new line returns 201 'added'", async () => {
        query
            .mockResolvedValueOnce({ affectedRows: 1 }) // upsert -> inserted
            .mockResolvedValueOnce([{ quantity: 1 }]);  // read-back
        const res = await request(app)
            .post("/cart")
            .set(authHeader({ id: 5 }))
            .send({ product_id: 99, quantity: 1 });
        expect(res.status).toBe(201);
        expect(res.body.itemStatus).toBe("added");
        expect(res.body.quantity).toBe(1);
    });

    test("adding an existing line increments (affectedRows=2 -> 200)", async () => {
        query
            .mockResolvedValueOnce({ affectedRows: 2 }) // upsert -> updated
            .mockResolvedValueOnce([{ quantity: 3 }]);  // read-back
        const res = await request(app)
            .post("/cart")
            .set(authHeader({ id: 5 }))
            .send({ product_id: 99, quantity: 1 });
        expect(res.status).toBe(200);
        expect(res.body.itemStatus).toBe("incremented");
        expect(res.body.quantity).toBe(3);
    });

    test("the upsert is keyed on the JWT user id, not anything in the body", async () => {
        query
            .mockResolvedValueOnce({ affectedRows: 1 })
            .mockResolvedValueOnce([{ quantity: 1 }]);
        await request(app)
            .post("/cart")
            .set(authHeader({ id: 5 }))
            // attacker tries to stuff a different user_id — must be ignored
            .send({ product_id: 99, quantity: 1, user_id: 9999 });
        // First call is the upsert INSERT ... VALUES (user_id, product_id, qty)
        const [, params] = query.mock.calls[0];
        expect(params[0]).toBe(5);    // JWT id
        expect(params[0]).not.toBe(9999);
    });

    test("requires authentication", async () => {
        const res = await request(app).post("/cart").send({ product_id: 1, quantity: 1 });
        expect(res.status).toBe(401);
    });
});

describe("GET /cart/:id (IDOR)", () => {
    test("returns the JWT user's cart regardless of the :id in the URL", async () => {
        query.mockResolvedValueOnce([{ product_id: 1, quantity: 2, price: 10 }]);
        await request(app)
            .get("/cart/9999") // someone else's id in the URL
            .set(authHeader({ id: 5 }));
        // The query must be parameterized with the JWT id (5), not 9999.
        const [, params] = query.mock.calls[0];
        expect(params[0]).toBe(5);
    });
});

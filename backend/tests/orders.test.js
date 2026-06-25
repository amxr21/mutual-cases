/**
 * Order tests — server-authoritative pricing and the Buy Now cart behaviour.
 *
 * createOrder runs inside withTransaction(work); we mock it to invoke `work`
 * with a fake `tx` whose responses we script, then assert on the SQL the
 * handler emits (prices come from the DB, totals computed server-side, and
 * Buy Now leaves the rest of the cart intact).
 */
jest.mock("../dbClient");

const request = require("supertest");
const createApp = require("../app");
const { withTransaction } = require("../dbClient");
const { authHeader } = require("./helpers");

const app = createApp({ rateLimit: false });

const address = { country: "United Arab Emirates", city: "Dubai", area: "Marina", address: "1" };

/**
 * Drive createOrder's transaction. `tx` answers the product lookup with a
 * trusted price and returns benign results for the writes. Captures every SQL
 * statement so tests can assert on cart-clear behaviour.
 */
function mockTransaction({ price = 50 } = {}) {
    const statements = [];
    withTransaction.mockImplementation(async (work) => {
        const tx = async (sql, params = []) => {
            statements.push({ sql, params });
            if (/FROM products/i.test(sql)) {
                // Trusted product row: price comes from here, NOT the client.
                return [{ id: 99, price, edition: 1, model: "X", category: "case", edition_id: 1, model_id: 1, category_id: 1 }];
            }
            if (/INSERT INTO orders/i.test(sql)) return { insertId: 1000 };
            return { insertId: 1, affectedRows: 1 };
        };
        return work(tx);
    });
    return statements;
}

describe("POST /orders pricing", () => {
    test("total is computed from the DB price, ignoring any client-sent price", async () => {
        const statements = mockTransaction({ price: 50 });
        const res = await request(app)
            .post("/orders")
            .set(authHeader({ id: 5 }))
            // client tries to pay 1 AED for a qty-2 order; server must ignore it
            .send({ address, items: [{ product_id: 99, quantity: 2, price: 1 }] });

        expect(res.status).toBe(201);
        const orderInsert = statements.find((s) => /INSERT INTO orders/i.test(s.sql));
        // total param = 50 * 2 = 100 (server truth from the DB price), never the
        // client's claimed 1 AED. The total is the lone 100 in the params.
        expect(orderInsert.params).toContain(100);
        expect(res.body.total).toBe(100);
    });

    test("a normal order clears the whole cart", async () => {
        const statements = mockTransaction();
        await request(app)
            .post("/orders")
            .set(authHeader({ id: 5 }))
            .send({ address, items: [{ product_id: 99, quantity: 1 }] });
        const clear = statements.find((s) => /DELETE FROM cart_items/i.test(s.sql));
        expect(clear).toBeDefined();
        // Whole-cart clear: WHERE user_id = ? only (no product_id filter).
        expect(clear.sql).not.toMatch(/product_id IN/i);
    });

    test("Buy Now removes only the purchased item, leaving the rest of the cart", async () => {
        const statements = mockTransaction();
        await request(app)
            .post("/orders")
            .set(authHeader({ id: 5 }))
            .send({ address, items: [{ product_id: 99, quantity: 1 }], buy_now: true });
        const clear = statements.find((s) => /DELETE FROM cart_items/i.test(s.sql));
        expect(clear).toBeDefined();
        // Scoped delete: only the purchased product id(s).
        expect(clear.sql).toMatch(/product_id IN/i);
    });

    test("rejects an empty items array with 422 (schema) ", async () => {
        mockTransaction();
        const res = await request(app)
            .post("/orders")
            .set(authHeader({ id: 5 }))
            .send({ address, items: [] });
        expect(res.status).toBe(422);
    });

    test("requires authentication", async () => {
        const res = await request(app).post("/orders").send({ address, items: [{ product_id: 1, quantity: 1 }] });
        expect(res.status).toBe(401);
    });
});

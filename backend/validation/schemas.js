/**
 * Zod schemas for request validation at the route boundary.
 *
 * Kept deliberately permissive where the existing API is loose (e.g. free-text
 * model/edition), but strict on types and presence so controllers can trust
 * their inputs and the DB never receives garbage. The `validate` middleware
 * replaces req.body/params/query with the parsed output, so coercion here
 * (e.g. string -> number for params) is intentional.
 */
const { z } = require("zod");

// Numeric id coming from a URL param (always a string on the wire).
const idParam = z.object({
    id: z.coerce.number().int().positive(),
});

const nonEmptyStr = (max) => z.string().trim().min(1).max(max);

// Accept booleans or 0/1/"true"/"false" for trend; normalize to 0/1.
const trendField = z
    .union([z.boolean(), z.literal(0), z.literal(1), z.enum(["true", "false", "0", "1"])])
    .transform((v) => (v === true || v === 1 || v === "true" || v === "1" ? 1 : 0));

const productCreateSchema = z.object({
    trend: trendField.default(0),
    price: z.coerce.number().nonnegative().max(1_000_000),
    model: nonEmptyStr(100),
    edition: nonEmptyStr(100),
    category: nonEmptyStr(100),
    type: nonEmptyStr(255),
    quantity: z.coerce.number().int().min(0).max(1_000_000),
    image_url_1: z.string().trim().max(500).optional().default(""),
    image_url_2: z.string().trim().max(500).optional().default(""),
    image_url_3: z.string().trim().max(500).optional().default(""),
});

// All fields optional for PATCH; at least one must be present.
const productUpdateSchema = z
    .object({
        trend: trendField.optional(),
        price: z.coerce.number().nonnegative().max(1_000_000).optional(),
        model: nonEmptyStr(100).optional(),
        edition: nonEmptyStr(100).optional(),
        category: nonEmptyStr(100).optional(),
        type: nonEmptyStr(255).optional(),
        quantity: z.coerce.number().int().min(0).max(1_000_000).optional(),
        image_url_1: z.string().trim().max(500).optional(),
        image_url_2: z.string().trim().max(500).optional(),
        image_url_3: z.string().trim().max(500).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
        message: "Provide at least one field to update",
    });

// user_id is derived from the JWT, not the body.
const cartAddSchema = z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(1000).default(1),
});

const cartUpdateSchema = z.object({
    id: z.coerce.number().int().positive(), // product_id
    quantity: z.coerce.number().int().min(0).max(1000),
});

const cartRemoveSchema = z.object({
    product_id: z.coerce.number().int().positive(),
});

const authSchema = z.object({
    id_token: z.string().min(10),
});

// --- Liked / wishlist (user_id from JWT) ---
const likeAddSchema = z.object({
    product_id: z.coerce.number().int().positive(),
});

const likeRemoveSchema = z.object({
    product_id: z.coerce.number().int().positive(),
});

// --- Custom-it submission ---
const customOrderSchema = z.object({
    user_id: z.coerce.number().int().positive().optional(),
    model: nonEmptyStr(100),
    sentence: z.string().trim().max(255).optional().default(""),
    type: nonEmptyStr(100),
    design: nonEmptyStr(100),
    comments: z.string().trim().max(1000).optional().default(""),
});

// --- Checkout / orders ---
const addressSchema = z.object({
    country: nonEmptyStr(255),
    city: nonEmptyStr(100),
    area: nonEmptyStr(255),
    address: z.string().trim().max(255).optional().default(""),
});

const orderCreateSchema = z.object({
    // user_id is derived from the JWT, not the body.
    address: addressSchema,
    items: z
        .array(
            z.object({
                product_id: z.coerce.number().int().positive(),
                quantity: z.coerce.number().int().min(1).max(1000),
            })
        )
        .min(1),
    note: z.string().trim().max(500).optional().default(""),
    gift: z.coerce.boolean().optional().default(false),
    gift_message: z.string().trim().max(300).optional().default(""),
    payment_method: z.enum(["cod", "card_on_delivery"]).optional().default("cod"),
});

const orderNumberParam = z.object({
    orderNumber: z.string().trim().min(4).max(40),
});

module.exports = {
    idParam,
    productCreateSchema,
    productUpdateSchema,
    cartAddSchema,
    cartUpdateSchema,
    cartRemoveSchema,
    authSchema,
    likeAddSchema,
    likeRemoveSchema,
    customOrderSchema,
    orderCreateSchema,
    orderNumberParam,
};

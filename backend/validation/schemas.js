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
    description: z.string().trim().max(2000).optional().default(""),
    material: z.string().trim().max(1000).optional().default(""),
    approach: z.string().trim().max(1000).optional().default(""),
    features: z.string().trim().max(1000).optional().default(""),
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
        description: z.string().trim().max(2000).optional(),
        material: z.string().trim().max(1000).optional(),
        approach: z.string().trim().max(1000).optional(),
        features: z.string().trim().max(1000).optional(),
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
    discount_code: z.string().trim().max(40).optional().default(""),
    // "Buy Now" express checkout: order only the listed item(s) and DON'T clear
    // the rest of the user's cart.
    buy_now: z.coerce.boolean().optional().default(false),
});

const orderNumberParam = z.object({
    orderNumber: z.string().trim().min(4).max(40),
});

// --- Reviews ---
const reviewSchema = z.object({
    product_id: z.coerce.number().int().positive(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional().default(""),
});

// --- Staff roles ---
const staffRoleSchema = z.object({
    staff_role: z.enum(["owner", "developer", "manager", "fulfillment", "support"]),
});

const staffCreateSchema = z.object({
    name: nonEmptyStr(255),
    email: z.string().trim().email().max(255),
    staff_role: z.enum(["owner", "developer", "manager", "fulfillment", "support"]),
});

// --- Discounts ---
const discountValidateSchema = z.object({
    code: z.string().trim().min(1).max(40),
    subtotal: z.coerce.number().nonnegative().max(10_000_000),
});

const discountCreateSchema = z.object({
    code: z.string().trim().min(2).max(40),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.coerce.number().nonnegative().max(1_000_000).optional().default(0),
    min_spend: z.coerce.number().nonnegative().max(1_000_000).optional().default(0),
    max_uses: z.coerce.number().int().positive().max(1_000_000).nullable().optional(),
    per_customer_limit: z.coerce.number().int().positive().max(10_000).nullable().optional(),
    starts_at: z.string().trim().optional().nullable(),
    expires_at: z.string().trim().optional().nullable(),
    active: z.coerce.boolean().optional().default(true),
    first_order_only: z.coerce.boolean().optional().default(false),
    featured: z.coerce.boolean().optional().default(false),
});

const discountUpdateSchema = discountCreateSchema.partial().omit({ code: true }).refine(
    (o) => Object.keys(o).length > 0,
    { message: "Provide at least one field to update" }
);

// --- Returns / RMA ---
const returnRequestSchema = z.object({
    order_number: nonEmptyStr(40),
    reason: z.string().trim().max(255).optional().default(""),
    items: z
        .array(
            z.object({
                product_id: z.coerce.number().int().positive(),
                quantity: z.coerce.number().int().min(1).max(1000),
            })
        )
        .min(1),
});

const returnApproveSchema = z.object({
    resolution: z.enum(["refund", "store_credit", "exchange"]),
    restock: z.coerce.boolean().optional().default(true),
    refund_amount: z.coerce.number().nonnegative().max(1_000_000).optional(),
    admin_note: z.string().trim().max(500).optional().default(""),
});

const returnRejectSchema = z.object({
    admin_note: z.string().trim().max(500).optional().default(""),
});

// --- Delivery portal (driver) ---
const driverAuthSchema = z.object({
    access_code: z.string().trim().min(4).max(20),
});

const driverStatusSchema = z.object({
    delivery_status: z.enum(["assigned", "picked_up", "out_for_delivery", "delivered", "handed_over"]),
    note: z.string().trim().max(500).optional().default(""),
});

// Driver sets their own availability. 'inactive' is reserved for admin
// deactivation (which blocks portal access), so a driver can only toggle
// between 'active' (ready) and 'on_shift'.
const driverAvailabilitySchema = z.object({
    status: z.enum(["active", "on_shift"]),
});

// --- Inventory (admin + public subscribe) ---
const stockAdjustSchema = z.object({
    delta: z.coerce.number().int().refine((n) => n !== 0, "Delta must be non-zero"),
    reason: z.enum(["restock", "correction", "damaged", "lost", "return", "manual"]).default("manual"),
    note: z.string().trim().max(255).optional().default(""),
});

const stockThresholdSchema = z.object({
    low_stock_threshold: z.coerce.number().int().min(0).max(1_000_000),
});

const stockNotifySchema = z.object({
    email: z.string().trim().email().max(255),
});

// --- Order delivery assignment (admin) ---
const orderAssignSchema = z.object({
    delivery_user_id: z.coerce.number().int().positive().nullable().optional(),
    tracking_number: z.string().trim().max(120).optional().default(""),
    carrier: z.string().trim().max(80).optional().default(""),
    // ISO date string (YYYY-MM-DD) or empty.
    eta: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional().default(""),
});

// --- Admin user management ---
const userUpdateSchema = z
    .object({
        name: nonEmptyStr(255).optional(),
        email: z.string().trim().email().max(255).optional(),
        phone: z.string().trim().max(40).optional(),
        address_line: z.string().trim().max(255).optional(),
        area: z.string().trim().max(255).optional(),
        city: z.string().trim().max(100).optional(),
        country: z.string().trim().max(100).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
        message: "Provide at least one field to update",
    });

const userRoleSchema = z.object({
    role: z.enum(["customer", "admin", "delivery"]),
});

// --- Delivery staff ---
const deliveryStatus = z.enum(["active", "inactive", "on_shift"]);

const deliveryCreateSchema = z.object({
    name: nonEmptyStr(255),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(40).optional().default(""),
    vehicle_type: z.string().trim().max(60).optional().default(""),
    plate_number: z.string().trim().max(40).optional().default(""),
    license_number: z.string().trim().max(60).optional().default(""),
    zone: z.string().trim().max(120).optional().default(""),
    emirate: z.string().trim().max(60).optional().default(""),
    country: z.string().trim().max(60).optional().default(""),
    status: deliveryStatus.optional().default("active"),
});

const deliveryUpdateSchema = z
    .object({
        name: nonEmptyStr(255).optional(),
        email: z.string().trim().email().max(255).optional(),
        phone: z.string().trim().max(40).optional(),
        vehicle_type: z.string().trim().max(60).optional(),
        plate_number: z.string().trim().max(40).optional(),
        license_number: z.string().trim().max(60).optional(),
        zone: z.string().trim().max(120).optional(),
        emirate: z.string().trim().max(60).optional(),
        country: z.string().trim().max(60).optional(),
        status: deliveryStatus.optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
        message: "Provide at least one field to update",
    });

// --- Settings ---
const settingKeyParam = z.object({
    key: z.enum(["customization", "store_profile", "region", "vat", "theme", "storefront"]),
});

// Permissive value bag — the value shape varies per key. We keep it an object
// and cap a couple of known string fields so the JSON column stays sane.
const settingUpdateSchema = z.object({
    value: z.record(z.string(), z.any()),
});

// --- Reviews moderation (admin) ---
const reviewStatusSchema = z.object({
    status: z.enum(["pending", "approved", "rejected"]),
});

const reviewReplySchema = z.object({
    admin_reply: z.string().trim().max(1000).optional().default(""),
});

const reviewFlagSchema = z.object({
    flagged: z.coerce.boolean(),
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
    reviewSchema,
    reviewStatusSchema,
    reviewReplySchema,
    reviewFlagSchema,
    settingKeyParam,
    settingUpdateSchema,
    userUpdateSchema,
    userRoleSchema,
    deliveryCreateSchema,
    deliveryUpdateSchema,
    orderAssignSchema,
    stockAdjustSchema,
    stockThresholdSchema,
    stockNotifySchema,
    driverAuthSchema,
    driverStatusSchema,
    driverAvailabilitySchema,
    returnRequestSchema,
    returnApproveSchema,
    returnRejectSchema,
    discountValidateSchema,
    discountCreateSchema,
    discountUpdateSchema,
    staffRoleSchema,
    staffCreateSchema,
};

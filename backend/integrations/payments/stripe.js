/**
 * Stripe payment driver (stub).
 * Configured when STRIPE_SECRET_KEY is set. Real implementation: create a
 * PaymentIntent / Checkout Session and verify via webhook.
 */
const logger = require("../../logger");

const configured = !!process.env.STRIPE_SECRET_KEY;

module.exports = {
    label: "Stripe",
    configured,
    /** Begin a payment; returns a checkout reference (stub). */
    async createPayment({ orderNumber, amount, currency = "AED" }) {
        if (!configured) {
            logger.info("Stripe createPayment (stub — not configured)", { orderNumber, amount });
            return { ok: true, simulated: true, provider: "stripe", reference: `SIM-STRIPE-${Date.now()}` };
        }
        throw new Error("Stripe live integration not implemented yet");
    },
    async refund({ orderNumber, amount }) {
        logger.info("Stripe refund (stub)", { orderNumber, amount });
        return { ok: true, simulated: !configured, provider: "stripe" };
    },
};

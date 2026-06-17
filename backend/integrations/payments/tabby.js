/**
 * Tabby BNPL driver (stub) — "pay later / split" for UAE/GCC.
 * Configured when TABBY_SECRET_KEY + TABBY_MERCHANT_CODE are set.
 */
const logger = require("../../logger");

const configured = !!(process.env.TABBY_SECRET_KEY && process.env.TABBY_MERCHANT_CODE);

module.exports = {
    label: "Tabby (BNPL)",
    configured,
    async createPayment({ orderNumber, amount, currency = "AED" }) {
        if (!configured) {
            logger.info("Tabby createPayment (stub — not configured)", { orderNumber, amount });
            return { ok: true, simulated: true, provider: "tabby", reference: `SIM-TABBY-${Date.now()}` };
        }
        throw new Error("Tabby live integration not implemented yet");
    },
    async refund({ orderNumber, amount }) {
        logger.info("Tabby refund (stub)", { orderNumber, amount });
        return { ok: true, simulated: !configured, provider: "tabby" };
    },
};

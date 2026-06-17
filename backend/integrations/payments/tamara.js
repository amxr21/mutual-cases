/**
 * Tamara BNPL driver (stub) — "pay later / installments" for UAE/GCC.
 * Configured when TAMARA_API_TOKEN is set.
 */
const logger = require("../../logger");

const configured = !!process.env.TAMARA_API_TOKEN;

module.exports = {
    label: "Tamara (BNPL)",
    configured,
    async createPayment({ orderNumber, amount, currency = "AED" }) {
        if (!configured) {
            logger.info("Tamara createPayment (stub — not configured)", { orderNumber, amount });
            return { ok: true, simulated: true, provider: "tamara", reference: `SIM-TAMARA-${Date.now()}` };
        }
        throw new Error("Tamara live integration not implemented yet");
    },
    async refund({ orderNumber, amount }) {
        logger.info("Tamara refund (stub)", { orderNumber, amount });
        return { ok: true, simulated: !configured, provider: "tamara" };
    },
};

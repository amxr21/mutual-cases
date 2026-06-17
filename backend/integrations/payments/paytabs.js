/**
 * PayTabs payment driver (stub) — UAE/GCC card gateway.
 * Configured when PAYTABS_PROFILE_ID + PAYTABS_SERVER_KEY are set.
 */
const logger = require("../../logger");

const configured = !!(process.env.PAYTABS_PROFILE_ID && process.env.PAYTABS_SERVER_KEY);

module.exports = {
    label: "PayTabs",
    configured,
    async createPayment({ orderNumber, amount, currency = "AED" }) {
        if (!configured) {
            logger.info("PayTabs createPayment (stub — not configured)", { orderNumber, amount });
            return { ok: true, simulated: true, provider: "paytabs", reference: `SIM-PAYTABS-${Date.now()}` };
        }
        throw new Error("PayTabs live integration not implemented yet");
    },
    async refund({ orderNumber, amount }) {
        logger.info("PayTabs refund (stub)", { orderNumber, amount });
        return { ok: true, simulated: !configured, provider: "paytabs" };
    },
};

/**
 * Fetchr shipping driver (stub).
 * Configured when FETCHR_API_KEY is set.
 */
const logger = require("../../logger");

const configured = !!process.env.FETCHR_API_KEY;

module.exports = {
    label: "Fetchr",
    configured,
    async getRate({ destination, weight }) {
        if (!configured) {
            logger.info("Fetchr getRate (stub)", { destination, weight });
            return { ok: true, simulated: true, provider: "fetchr", amount: 20, currency: "AED" };
        }
        throw new Error("Fetchr live integration not implemented yet");
    },
    async createShipment({ orderNumber, address }) {
        logger.info("Fetchr createShipment (stub)", { orderNumber });
        return { ok: true, simulated: !configured, provider: "fetchr", tracking: `SIM-FETCHR-${Date.now()}`, labelUrl: null };
    },
    async track({ tracking }) {
        return { ok: true, simulated: !configured, provider: "fetchr", tracking, status: "in_transit" };
    },
};

/**
 * Aramex shipping driver (stub).
 * Configured when ARAMEX_ACCOUNT_NUMBER + ARAMEX_ACCOUNT_PIN are set.
 * Real surface: rate calculation, shipment/label creation, tracking.
 */
const logger = require("../../logger");

const configured = !!(process.env.ARAMEX_ACCOUNT_NUMBER && process.env.ARAMEX_ACCOUNT_PIN);

module.exports = {
    label: "Aramex",
    configured,
    async getRate({ destination, weight }) {
        if (!configured) {
            logger.info("Aramex getRate (stub)", { destination, weight });
            return { ok: true, simulated: true, provider: "aramex", amount: 25, currency: "AED" };
        }
        throw new Error("Aramex live integration not implemented yet");
    },
    async createShipment({ orderNumber, address }) {
        logger.info("Aramex createShipment (stub)", { orderNumber });
        return { ok: true, simulated: !configured, provider: "aramex", tracking: `SIM-ARAMEX-${Date.now()}`, labelUrl: null };
    },
    async track({ tracking }) {
        return { ok: true, simulated: !configured, provider: "aramex", tracking, status: "in_transit" };
    },
};

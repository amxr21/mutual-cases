/**
 * Refund provider interface (stub).
 *
 * A clean seam for refunding to a real payment provider (PayTabs/Stripe/Tabby/
 * Tamara) later. Today there's no live card payment in the flow (COD/card-on-
 * delivery), so this records intent and resolves successfully — mirroring how
 * the email mailer and Cloudinary uploader degrade gracefully when unconfigured.
 *
 * When a provider is wired up, replace `processRefund` with a real API call
 * keyed off the order's payment reference; the returns flow doesn't change.
 */
const logger = require("../logger");

/**
 * @param {object} args
 * @param {string} args.orderNumber
 * @param {number} args.amount
 * @param {string} args.method      original payment method (cod, card_on_delivery, …)
 * @returns {Promise<{ ok: boolean, provider: string, reference?: string, simulated?: boolean }>}
 */
async function processRefund({ orderNumber, amount, method }) {
    // No live online-payment provider configured → simulate success and log it.
    logger.info("Refund (simulated — no live provider)", { orderNumber, amount, method });
    return {
        ok: true,
        provider: "none",
        simulated: true,
        reference: `SIM-REFUND-${Date.now()}`,
    };
}

module.exports = { processRefund };

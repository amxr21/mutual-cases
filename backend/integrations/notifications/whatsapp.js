/**
 * WhatsApp notification driver (stub).
 *
 * Configured when either Meta Cloud API (WHATSAPP_PHONE_NUMBER_ID +
 * WHATSAPP_ACCESS_TOKEN) or Twilio (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN)
 * credentials are present. Until then, sends are simulated + logged — like the
 * email mailer — so order-update hooks can call this safely today.
 */
const logger = require("../../logger");

const metaConfigured = !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
const configured = metaConfigured || twilioConfigured;

module.exports = {
    label: "WhatsApp",
    configured,
    provider: metaConfigured ? "meta" : twilioConfigured ? "twilio" : "none",

    /** Send a WhatsApp message (best-effort; never throws). */
    async send({ to, message }) {
        if (!to) return { ok: false, reason: "no recipient" };
        if (!configured) {
            logger.info("WhatsApp send (stub — not configured)", { to });
            return { ok: true, simulated: true };
        }
        // Real implementation would POST to Meta Graph API or Twilio here.
        logger.info("WhatsApp send", { to });
        return { ok: true };
    },

    /** Convenience: an order-status update message. */
    async sendOrderUpdate({ to, orderNumber, status }) {
        return this.send({ to, message: `Your Mutual order ${orderNumber} is now: ${status}.` });
    },
};

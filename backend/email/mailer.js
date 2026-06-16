/**
 * Email sender (Resend).
 *
 * If RESEND_API_KEY is set, sends via Resend. If not, it logs a "would send"
 * entry through the logger and resolves successfully — so the app runs in dev
 * and the order flow never breaks just because email isn't configured yet.
 * Sending is always best-effort: a mail failure is logged, never thrown back
 * into the request that triggered it.
 */
const config = require("../config");
const logger = require("../logger");

let resendClient = null;
if (config.email.enabled) {
    try {
        const { Resend } = require("resend");
        resendClient = new Resend(config.email.resendApiKey);
    } catch (err) {
        logger.error("Failed to initialize Resend client", { message: err?.message });
    }
}

/**
 * @param {{ to:string, subject:string, html:string, text?:string }} msg
 * @returns {Promise<{ ok:boolean, skipped?:boolean }>}
 */
async function sendEmail({ to, subject, html, text }) {
    if (!to) {
        logger.warn("sendEmail called with no recipient", { subject });
        return { ok: false };
    }

    if (!resendClient) {
        // No provider configured — record intent and move on.
        logger.info("Email skipped (no RESEND_API_KEY); would have sent", { to, subject });
        return { ok: true, skipped: true };
    }

    try {
        await resendClient.emails.send({ from: config.email.from, to, subject, html, text });
        logger.info("Email sent", { to, subject });
        return { ok: true };
    } catch (err) {
        logger.error("Email send failed", { to, subject, message: err?.message });
        return { ok: false };
    }
}

module.exports = { sendEmail };

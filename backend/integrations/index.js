/**
 * Integrations registry — payment, shipping, and notification providers.
 *
 * Each provider is a small driver with a `configured` flag (true only when its
 * env credentials are present) and a uniform method surface. Today every driver
 * is a STUB: when unconfigured (the default) it records intent and returns a
 * simulated result, exactly like the email mailer / Cloudinary uploader. Wiring
 * a real provider later means filling in one driver file — callers don't change.
 *
 * This file exposes:
 *   - getIntegrationsStatus(): which providers are configured (for the admin UI)
 *   - payments / shipping / notifications: the active drivers
 */
const config = require("../config");

// --- Payment providers ----------------------------------------------------
const stripe = require("./payments/stripe");
const paytabs = require("./payments/paytabs");
const tabby = require("./payments/tabby");
const tamara = require("./payments/tamara");

// --- Shipping providers ---------------------------------------------------
const aramex = require("./shipping/aramex");
const fetchr = require("./shipping/fetchr");

// --- Notifications --------------------------------------------------------
const whatsapp = require("./notifications/whatsapp");

const PAYMENTS = { stripe, paytabs, tabby, tamara };
const SHIPPING = { aramex, fetchr };
const NOTIFICATIONS = { whatsapp };

/** A flat status map of every provider for the admin Integrations panel. */
function getIntegrationsStatus() {
    const map = (group) =>
        Object.fromEntries(Object.entries(group).map(([k, d]) => [k, { configured: !!d.configured, label: d.label }]));
    return {
        payments: map(PAYMENTS),
        shipping: map(SHIPPING),
        notifications: map(NOTIFICATIONS),
    };
}

module.exports = {
    getIntegrationsStatus,
    payments: PAYMENTS,
    shipping: SHIPPING,
    notifications: NOTIFICATIONS,
    config,
};

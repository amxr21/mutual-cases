/**
 * Client-side error reporter (browser).
 *
 * Safe to import from client components. Fire-and-forget: posts an error report
 * to the client-log endpoint and swallows any failure (a logging error must
 * never surface to the user or recurse). Uses sendBeacon when available so
 * reports survive page unload.
 */

import { publicConfig } from "./config";

/**
 * @param {object} report
 * @param {string} report.message
 * @param {string} [report.stack]
 * @param {string} [report.source]    where it came from
 * @param {string} [report.component] component/boundary name
 * @param {string} [report.digest]    Next.js error digest
 */
export function reportClientError(report = {}) {
    try {
        if (!publicConfig.clientLoggingEnabled) return;
        if (typeof window === "undefined") return;

        const payload = JSON.stringify({
            ...report,
            pathname: report.pathname || window.location?.pathname,
        });

        const url = publicConfig.clientLogEndpoint;

        // Prefer sendBeacon (survives unload); fall back to fetch keepalive.
        if (navigator?.sendBeacon) {
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon(url, blob);
        } else {
            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
                keepalive: true,
            }).catch(() => {});
        }
    } catch {
        // Never throw from the reporter.
    }
}

let installed = false;

/**
 * Install global window error + unhandledrejection listeners once.
 * Call from a top-level client component mounted on every page.
 */
export function installGlobalErrorListeners() {
    if (installed || typeof window === "undefined") return;
    installed = true;

    window.addEventListener("error", (event) => {
        reportClientError({
            source: "window.onerror",
            message: event?.message || "window error",
            stack: event?.error?.stack,
        });
    });

    window.addEventListener("unhandledrejection", (event) => {
        const reason = event?.reason;
        reportClientError({
            source: "unhandledrejection",
            message: (reason && (reason.message || String(reason))) || "unhandled rejection",
            stack: reason?.stack,
        });
    });
}

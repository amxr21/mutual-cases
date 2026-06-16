/**
 * Central fetch wrapper for all client-side API calls.
 *
 * Guarantees a consistent result shape and never throws for network/HTTP/parse
 * failures — callers branch on `ok` instead of wrapping every call in try/catch.
 * Adds a timeout (AbortController), parses JSON safely, surfaces the backend's
 * `{ error: { message, code } }` shape, and reports unexpected failures to the
 * client logger.
 *
 * Result:
 *   { ok: true,  status, data }
 *   { ok: false, status, error: { message, code }, data? }
 */

import { publicConfig } from "./config";
import { reportClientError } from "./clientLogger";

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * @param {string} path  path beginning with '/', appended to API base url
 * @param {RequestInit & { timeoutMs?: number, baseUrl?: string }} [options]
 */
export async function safeFetch(path, options = {}) {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, baseUrl = publicConfig.apiBaseUrl, ...init } = options;

    if (!baseUrl) {
        const error = { message: "API base URL is not configured", code: "CONFIG_ERROR" };
        reportClientError({ source: "fetch", message: error.message, component: path });
        return { ok: false, status: 0, error };
    }

    const url = `${baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Attach the auth token (set at login) so protected routes can identify the
    // user from the JWT rather than a client-supplied id.
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers = { ...(init.headers || {}) };
    // Attach the default session token only if the caller didn't already supply
    // an Authorization header (e.g. the delivery portal passes its own token).
    const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
    if (token && !hasAuth) headers.Authorization = `Bearer ${token}`;

    try {
        const res = await fetch(url, { ...init, headers, signal: controller.signal });

        // Parse body defensively — it may be empty or non-JSON.
        let body = null;
        const text = await res.text();
        if (text) {
            try {
                body = JSON.parse(text);
            } catch {
                body = text;
            }
        }

        if (!res.ok) {
            const error =
                body && typeof body === "object" && body.error
                    ? body.error
                    : { message: `Request failed (${res.status})`, code: "HTTP_ERROR" };
            // 5xx are unexpected; report them. 4xx are usually expected (validation, not-found).
            if (res.status >= 500) {
                reportClientError({
                    source: "fetch",
                    message: `${init.method || "GET"} ${path} -> ${res.status}: ${error.message}`,
                    component: path,
                });
            }
            return { ok: false, status: res.status, error, data: body };
        }

        return { ok: true, status: res.status, data: body };
    } catch (err) {
        const aborted = err?.name === "AbortError";
        const error = {
            message: aborted ? "The request timed out" : "Network error — please try again",
            code: aborted ? "TIMEOUT" : "NETWORK_ERROR",
        };
        reportClientError({
            source: "fetch",
            message: `${init.method || "GET"} ${path} failed: ${err?.message || error.message}`,
            stack: err?.stack,
            component: path,
        });
        return { ok: false, status: 0, error };
    } finally {
        clearTimeout(timer);
    }
}

/** Convenience helpers. */
export const getJSON = (path, options) => safeFetch(path, { ...options, method: "GET" });

export const postJSON = (path, body, options) =>
    safeFetch(path, {
        ...options,
        method: "POST",
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
        body: JSON.stringify(body),
    });

export const patchJSON = (path, body, options) =>
    safeFetch(path, {
        ...options,
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
        body: JSON.stringify(body),
    });

export const putJSON = (path, body, options) =>
    safeFetch(path, {
        ...options,
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
        body: JSON.stringify(body),
    });

export const deleteJSON = (path, body, options) =>
    safeFetch(path, {
        ...options,
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
        body: body ? JSON.stringify(body) : undefined,
    });

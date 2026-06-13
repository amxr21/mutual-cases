/**
 * Client-error ingest endpoint.
 *
 * The browser can't write to disk, so client-side errors (error boundaries,
 * global window errors, failed fetches) are POSTed here and written to
 * <frontend>/logs/client-error-YYYY-MM-DD.log via the server logger.
 *
 * This is a public endpoint, so input is treated as untrusted: fields are
 * coerced to strings and truncated to bounded lengths to prevent log flooding
 * or injection of huge payloads. Always responds 204 (even on bad input) so a
 * logging failure never cascades into a visible client error.
 */

import { NextResponse } from "next/server";
import clientLogger from "../../lib/server/logger";

// This route does filesystem I/O — force the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = { message: 2000, stack: 8000, field: 512 };

const str = (val, max) => {
    if (val === undefined || val === null) return undefined;
    const s = typeof val === "string" ? val : JSON.stringify(val);
    return s.length > max ? `${s.slice(0, max)}…[truncated]` : s;
};

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));

        const message = str(body.message, MAX.message) || "Unknown client error";
        const meta = {
            stack: str(body.stack, MAX.stack),
            source: str(body.source, MAX.field), // 'error-boundary' | 'window.onerror' | 'unhandledrejection' | 'fetch'
            pathname: str(body.pathname, MAX.field),
            component: str(body.component, MAX.field),
            digest: str(body.digest, MAX.field),
            userAgent: str(request.headers.get("user-agent"), MAX.field),
        };

        // Pass message as the log message and the rest as metadata (no duplicate `message` key).
        clientLogger.error(message, meta);

        return new NextResponse(null, { status: 204 });
    } catch {
        // Never let the logging endpoint itself throw a 500 back to the client.
        return new NextResponse(null, { status: 204 });
    }
}

// Reject other methods cleanly.
export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

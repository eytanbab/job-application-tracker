import crypto from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Guards a cron route handler with `Authorization: Bearer <CRON_SECRET>`
 * (the header Vercel Cron sends when CRON_SECRET is set).
 *
 * Returns a response to send back when the request must be rejected,
 * or null when the request may proceed.
 *
 * - CRON_SECRET set: the bearer token must match.
 * - CRON_SECRET unset in production: refuse to run instead of running
 *   unprotected.
 * - CRON_SECRET unset outside production: allowed, for local development.
 */
export function rejectUnauthorizedCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Cron] CRON_SECRET is not set; refusing to run.");
      return NextResponse.json(
        { error: "Cron jobs are disabled: CRON_SECRET is not configured" },
        { status: 503 },
      );
    }
    return null;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!timingSafeEqualStrings(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

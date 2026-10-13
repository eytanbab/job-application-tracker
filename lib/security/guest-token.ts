import crypto from "node:crypto";
import { allowsDevFallbacks } from "@/lib/env";

// Publicly known, so only used in development, tests and demo mode.
const DEV_ONLY_SECRET = "jat-fallback-crypto-secret-entropy-2026";
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The HMAC key for guest tokens. A real deployment must sign with
 * CLERK_SECRET_KEY: a publicly known fallback would let anyone forge a guest
 * cookie for any guest ID and read that guest's applications.
 */
function getSigningSecret(): string {
  const secret = process.env.CLERK_SECRET_KEY;
  if (secret) return secret;
  if (allowsDevFallbacks()) return DEV_ONLY_SECRET;
  throw new Error("CLERK_SECRET_KEY is required to sign guest sessions in production.");
}

/**
 * Creates a cryptographically signed guest session token.
 * Format: `<uuid_v4>.<hex_hmac_sha256>`
 */
export function signGuestId(guestId: string): string {
  if (!UUID_V4_REGEX.test(guestId)) {
    throw new Error("Invalid guest ID format: must be a valid UUID v4");
  }

  const hmac = crypto.createHmac("sha256", getSigningSecret());
  hmac.update(guestId);
  const signature = hmac.digest("hex");

  return `${guestId}.${signature}`;
}

/**
 * Validates a signed guest session token.
 * Returns the verified UUID v4 guestId if signature is valid, or null if tampered.
 */
export function verifyGuestId(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [guestId, providedSignature] = parts;

  // Strict UUID v4 check prevents Clerk user ID spoofing (e.g. user_2...)
  if (!UUID_V4_REGEX.test(guestId)) {
    return null;
  }

  const hmac = crypto.createHmac("sha256", getSigningSecret());
  hmac.update(guestId);
  const expectedSignature = hmac.digest("hex");

  // Constant-time comparison prevents timing attacks
  try {
    const providedBuffer = Buffer.from(providedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    return guestId;
  } catch {
    return null;
  }
}

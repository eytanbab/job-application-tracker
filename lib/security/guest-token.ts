import crypto from "node:crypto";

const SECRET = process.env.CLERK_SECRET_KEY || "jat-fallback-crypto-secret-entropy-2026";
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Creates a cryptographically signed guest session token.
 * Format: `<uuid_v4>.<hex_hmac_sha256>`
 */
export function signGuestId(guestId: string): string {
  if (!UUID_V4_REGEX.test(guestId)) {
    throw new Error("Invalid guest ID format: must be a valid UUID v4");
  }

  const hmac = crypto.createHmac("sha256", SECRET);
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

  const hmac = crypto.createHmac("sha256", SECRET);
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

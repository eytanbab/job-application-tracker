import { createHmac, randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { signGuestId, verifyGuestId } from "../guest-token";

const GUEST_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

describe("guest tokens", () => {
  it("round-trips a signed guest ID", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");
    const token = signGuestId(GUEST_ID);

    expect(token).toMatch(new RegExp(`^${GUEST_ID}\\.[0-9a-f]{64}$`));
    expect(verifyGuestId(token)).toBe(GUEST_ID);
  });

  it("works with random UUIDs", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");
    const id = randomUUID();
    expect(verifyGuestId(signGuestId(id))).toBe(id);
  });

  it("refuses to sign anything but a UUID v4", () => {
    expect(() => signGuestId("user_2abc")).toThrow(/UUID v4/);
  });

  it("rejects a tampered signature", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");
    const token = signGuestId(GUEST_ID);
    const last = token.at(-1) === "0" ? "1" : "0";

    expect(verifyGuestId(token.slice(0, -1) + last)).toBeNull();
  });

  it("rejects a valid signature moved onto another guest ID", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");
    const signature = signGuestId(GUEST_ID).split(".")[1];
    const otherId = "11111111-2222-4333-8444-555555555555";

    expect(verifyGuestId(`${otherId}.${signature}`)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_other_key");
    const forged = signGuestId(GUEST_ID);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");

    expect(verifyGuestId(forged)).toBeNull();
  });

  it("rejects a Clerk-style user ID even with a correct HMAC", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");
    const userId = "user_2abcDEF";
    const hmac = createHmac("sha256", "sk_test_signing_key").update(userId).digest("hex");

    expect(verifyGuestId(`${userId}.${hmac}`)).toBeNull();
  });

  it.each([null, undefined, "", GUEST_ID, `${GUEST_ID}.`, `${GUEST_ID}.zz`, `${GUEST_ID}.ab.cd`])(
    "rejects malformed token %j",
    (token) => {
      vi.stubEnv("CLERK_SECRET_KEY", "sk_test_signing_key");
      expect(verifyGuestId(token)).toBeNull();
    },
  );

  it("uses a dev secret only outside production", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(verifyGuestId(signGuestId(GUEST_ID))).toBe(GUEST_ID);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "true");
    expect(verifyGuestId(signGuestId(GUEST_ID))).toBe(GUEST_ID);
  });

  it("refuses to sign or verify with the public dev secret in production", () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const devToken = signGuestId(GUEST_ID);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "");
    expect(() => signGuestId(GUEST_ID)).toThrow(/CLERK_SECRET_KEY is required/);
    expect(() => verifyGuestId(devToken)).toThrow(/CLERK_SECRET_KEY is required/);
  });
});

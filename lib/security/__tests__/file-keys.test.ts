import { describe, expect, it } from "vitest";
import { isOwnFileKey, isSignableFileKey } from "../file-keys";

const GUEST = "6f9c2a1e-3b4d-4c5e-8f70-1a2b3c4d5e6f";

describe("S3 file key rules", () => {
  it("accepts only the caller's own folder when storing a key", () => {
    expect(isOwnFileKey("user_a", "user_a/1-cv.pdf")).toBe(true);
    expect(isOwnFileKey("user_a", "user_b/1-cv.pdf")).toBe(false);
    expect(isOwnFileKey("user_a", "user_a/../user_b/1-cv.pdf")).toBe(false);
    expect(isOwnFileKey("user_a", "user_ab/1-cv.pdf")).toBe(false);
    expect(isOwnFileKey("user_a", `${GUEST}/1-cv.pdf`)).toBe(false);
  });

  it("also signs keys in a guest folder, which signing in leaves on moved rows", () => {
    expect(isSignableFileKey("user_a", "user_a/1-cv.pdf")).toBe(true);
    expect(isSignableFileKey("user_a", `${GUEST}/1-cv.pdf`)).toBe(true);
    expect(isSignableFileKey("user_a", "user_b/1-cv.pdf")).toBe(false);
    expect(isSignableFileKey("user_a", `${GUEST}/../user_b/1-cv.pdf`)).toBe(false);
  });
});

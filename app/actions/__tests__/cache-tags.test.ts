import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTag = vi.fn();
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ updateTag, revalidateTag }));

const { expireTag } = await import("../_utils/cache-tags");

describe("expireTag", () => {
  beforeEach(() => {
    updateTag.mockReset();
    revalidateTag.mockReset();
  });

  it("uses updateTag inside a server action, so the user reads their own write", () => {
    expireTag("applications:user_a");
    expect(updateTag).toHaveBeenCalledWith("applications:user_a");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("expires the tag at once where updateTag is not allowed (route handlers, after())", () => {
    updateTag.mockImplementation(() => {
      throw new Error("updateTag can only be called from within a Server Action.");
    });
    expireTag("applications:user_a");
    expect(revalidateTag).toHaveBeenCalledWith("applications:user_a", { expire: 0 });
  });
});

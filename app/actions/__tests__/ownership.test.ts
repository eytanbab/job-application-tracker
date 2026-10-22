import { beforeEach, describe, expect, it, vi } from "vitest";

// These checks live on the database path, so this file swaps the mock store
// for a stub `db` whose queries resolve to whatever each test queues.
const results: unknown[][] = [];
const writes: string[] = [];

/** A query builder: every method chains, and awaiting it takes the next queued result. */
function query(): unknown {
  const target = () => undefined;
  return new Proxy(target, {
    get(_t, prop) {
      if (prop === "then") {
        const value = results.shift() ?? [];
        return (resolve: (v: unknown) => unknown) => resolve(value);
      }
      return () => query();
    },
  });
}

vi.mock("@/app/db", () => ({
  isMockDb: false,
  db: {
    select: () => query(),
    insert: () => {
      writes.push("insert");
      return query();
    },
    update: () => {
      writes.push("update");
      return query();
    },
    delete: () => {
      writes.push("delete");
      return query();
    },
    batch: async () => {
      writes.push("batch");
      return [];
    },
  },
}));

vi.mock("../_utils/user-context", () => ({
  getCurrentUserIdOrThrow: async () => "user_a",
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
  revalidateTag: () => undefined,
  updateTag: () => undefined,
  unstable_cache: (fn: () => unknown) => fn,
}));

const applicationActions = await import("../applications");
const { updateApplication } = applicationActions;
const { createFile, getViewUrl, getDownloadUrl } = await import("../documents");

const GUEST_ID = "6f9c2a1e-3b4d-4c5e-8f70-1a2b3c4d5e6f";

describe("server actions only touch the caller's own records", () => {
  beforeEach(() => {
    results.length = 0;
    writes.length = 0;
  });

  it("refuses to update an application the caller does not own, and writes no history", async () => {
    results.push([]); // ownership lookup finds nothing
    await expect(
      updateApplication({
        id: "someone-elses-app",
        role_name: "Engineer",
        company_name: "Acme",
        date_applied: "2026-10-01",
        link: "https://acme.com/jobs/1",
        platform: "linkedin",
        location: "Remote",
        status: "Interview",
        statusCategory: "interview",
      } as never),
    ).rejects.toThrow("Application not found");
    expect(writes).toEqual([]);
  });

  it("refuses to store a file key outside the caller's folder", async () => {
    await expect(createFile("CV", "", "cv.pdf", "user_b/123-cv.pdf")).rejects.toThrow("Invalid file key");
    await expect(createFile("CV", "", "cv.pdf", "user_a/../user_b/123-cv.pdf")).rejects.toThrow("Invalid file key");
    expect(writes).toEqual([]);

    results.push([{ insertedId: "doc-1" }]);
    await expect(createFile("CV", "", "cv.pdf", "user_a/123-cv.pdf")).resolves.toEqual({ id: "doc-1" });
  });

  it("never signs a link for a key in another user's folder", async () => {
    results.push([{ file_key: "user_b/123-cv.pdf", file_name: "cv.pdf" }]);
    expect(await getViewUrl("doc-1")).toEqual({ error: "Document not found" });
    results.push([{ file_key: "user_b/123-cv.pdf", file_name: "cv.pdf" }]);
    expect(await getDownloadUrl("doc-1")).toEqual({ error: "Document not found" });
  });

  it("still signs keys left in a guest folder by the sign-in migration", async () => {
    vi.stubEnv("NEXT_AWS_S3_BUCKET_NAME", "test-bucket");
    results.push([{ file_key: `${GUEST_ID}/123-cv.pdf`, file_name: "cv.pdf" }]);
    const result = await getViewUrl("doc-1");
    expect(result.error).toBeUndefined();
    expect(result.url).toContain(`${GUEST_ID}/123-cv.pdf`);
    vi.unstubAllEnvs();
  });

  it("does not expose the ghost sync as a server action", () => {
    // Every export of a "use server" file is callable by any client, and the
    // sync takes a user id; it lives in lib/applications/ghost-sync.ts.
    expect(applicationActions).not.toHaveProperty("syncGhostedApplications");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { mockStore } from "@/lib/mock-data/mock-store";
import { createApplication, updateApplication } from "../applications";

const valid = {
  role_name: "Engineer",
  company_name: "Acme",
  date_applied: "2026-10-01",
  link: "https://acme.com/jobs/1",
  platform: "LinkedIn",
  location: "Remote",
  status: "Applied",
  statusCategory: "applied",
};

const linkOf = (id: string) => mockStore.getApplications().find((a) => a.id === id)?.link;

// Inline edits in the detail sheet call these actions without the form's
// validation, so the actions check their own input.
describe("create/update input checks (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it.each([
    [{ role_name: "  " }, "Enter the role title."],
    [{ company_name: "" }, "Enter the company name."],
    [{ date_applied: "" }, "Enter the date you applied."],
    [{ date_applied: "not a date" }, "Enter the date you applied."],
    [{ link: "javascript:alert(1)" }, "Enter a job link that starts with http:// or https://."],
  ])("rejects %o", async (change, message) => {
    await expect(createApplication({ ...valid, ...change } as never)).rejects.toThrow(message);
  });

  it("stores a bare link as https and allows an empty one", async () => {
    const [{ insertedId }] = await createApplication({ ...valid, link: "acme.com/jobs/2" } as never);
    expect(linkOf(insertedId!)).toBe("https://acme.com/jobs/2");

    await updateApplication({ ...valid, id: insertedId, link: "" } as never);
    expect(linkOf(insertedId!)).toBe("");
  });

  it("keeps non-URL text from older rows so status moves still save", async () => {
    const [{ insertedId }] = await createApplication({ ...valid, link: "N / A" } as never);
    await updateApplication({ ...valid, id: insertedId, link: "N / A", status: "Interview", statusCategory: "interview" } as never);
    expect(linkOf(insertedId!)).toBe("N / A");
  });
});

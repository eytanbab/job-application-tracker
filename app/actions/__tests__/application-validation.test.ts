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
    [{ link: "javascript:0;alert(1)" }, "Enter a job link that starts with http:// or https://."],
    [{ link: "JavaScript: alert(1)" }, "Enter a job link that starts with http:// or https://."],
    [{ link: "mailto:jobs@acme.com" }, "Enter a job link that starts with http:// or https://."],
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

  it("keeps free text with spaces from older rows, such as \"Remote: see notes\"", async () => {
    const [{ insertedId }] = await createApplication({ ...valid, link: "Remote: see notes" } as never);
    expect(linkOf(insertedId!)).toBe("Remote: see notes");
  });

  it("still moves an older row with an empty company, but refuses clearing one", async () => {
    const [{ insertedId }] = await createApplication(valid as never);
    const store = mockStore as unknown as { applications: { id: string; company_name: string }[] };
    store.applications.find((a) => a.id === insertedId)!.company_name = "";

    // A board move resends the stored row as it is
    await updateApplication({ ...valid, id: insertedId, company_name: "", status: "Interview", statusCategory: "interview" } as never);
    expect(mockStore.getApplications().find((a) => a.id === insertedId)?.statusCategory).toBe("interview");

    const [{ insertedId: other }] = await createApplication(valid as never);
    await expect(updateApplication({ ...valid, id: other, company_name: " " } as never)).rejects.toThrow("Enter the company name.");
  });
});

describe("follow-up, interview and contact fields (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  const stored = (id: string) => mockStore.getApplications().find((a) => a.id === id)!;

  it("cleans and stores them", async () => {
    const interviewAt = new Date("2026-11-03T14:30:00Z");
    const [{ insertedId }] = await createApplication({
      ...valid,
      followUpDate: "2026-11-01",
      interviewAt,
      contactName: "  Dana Levi ",
      contactEmail: "dana@acme.com",
      referredBy: "",
    } as never);
    expect(stored(insertedId!)).toMatchObject({
      followUpDate: "2026-11-01",
      interviewAt,
      contactName: "Dana Levi",
      contactEmail: "dana@acme.com",
      referredBy: null,
    });
  });

  it("drops a follow-up date that is not a day", async () => {
    const [{ insertedId }] = await createApplication({ ...valid, followUpDate: "soon" } as never);
    expect(stored(insertedId!).followUpDate).toBeNull();
  });

  it("refuses a malformed contact email", async () => {
    await expect(
      createApplication({ ...valid, contactEmail: "dana at acme" } as never),
    ).rejects.toThrow("Enter a valid contact email.");
  });

  it("keeps them when a save leaves them out", async () => {
    const [{ insertedId }] = await createApplication({
      ...valid,
      followUpDate: "2026-11-01",
      contactName: "Dana",
    } as never);
    await updateApplication({ ...valid, id: insertedId, status: "Interview", statusCategory: "interview" } as never);
    expect(stored(insertedId!)).toMatchObject({ followUpDate: "2026-11-01", contactName: "Dana" });
  });
});

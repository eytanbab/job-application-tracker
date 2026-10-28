import { describe, expect, it } from "vitest";
import { duplicateReason, jobLinkKey, nameKey } from "../duplicates";

const candidate = {
  id: "a1",
  role_name: "Senior Frontend Engineer",
  company_name: "Linear",
  link: "https://jobs.ashbyhq.com/linear/123/",
};

describe("jobLinkKey", () => {
  it("ignores scheme, www, trailing slashes and tracking parameters", () => {
    expect(jobLinkKey("http://www.linkedin.com/jobs/view/42/?trackingId=x&refId=y")).toBe(
      "linkedin.com/jobs/view/42",
    );
  });

  it("keeps parameters that name the job", () => {
    expect(jobLinkKey("https://acme.com/careers?gh_jid=7&utm_source=x")).toBe(
      "acme.com/careers?gh_jid=7",
    );
    expect(jobLinkKey("acme.com/careers?gh_jid=7")).not.toBe(jobLinkKey("acme.com/careers?gh_jid=8"));
  });

  it("is empty for text that isn't a link", () => {
    expect(jobLinkKey("")).toBe("");
    expect(jobLinkKey("mailto:jobs@acme.com")).toBe("");
  });
});

describe("nameKey", () => {
  it("drops case, spaces and punctuation", () => {
    expect(nameKey("Acme, Inc.")).toBe(nameKey("acme inc"));
  });
});

describe("duplicateReason", () => {
  it("matches the same posting link", () => {
    expect(duplicateReason({ link: "jobs.ashbyhq.com/linear/123?utm_source=x" }, candidate)).toBe("link");
  });

  it("matches the same role at the same company", () => {
    expect(
      duplicateReason({ role_name: "senior frontend engineer", company_name: "LINEAR" }, candidate),
    ).toBe("role");
  });

  it("does not match another role at the same company", () => {
    expect(
      duplicateReason({ role_name: "Backend Engineer", company_name: "Linear" }, candidate),
    ).toBeNull();
  });

  it("needs both a role and a company to match by name", () => {
    expect(duplicateReason({ company_name: "Linear" }, candidate)).toBeNull();
  });
});

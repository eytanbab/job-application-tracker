import { test, expect } from "@playwright/test";

// Guests (no Clerk session) can track applications but not use the paid AI
// features. Assumes the server runs with DATABASE_URL and Clerk keys set, as
// the rest of this suite does; in the no-setup demo the AI stays open.
test.use({ storageState: { cookies: [], origins: [] } });

const JOB_LINK = "https://example.com/careers/__E2E_TEST__-ai-access";

test.describe("AI access for guests", () => {
  test("POST /api/extract returns 401 auth_required", async ({ request }) => {
    // Visit once so the proxy issues a signed guest_id cookie, as a browser would
    await request.get("/applications");
    const response = await request.post("/api/extract", {
      data: { url: JOB_LINK },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({
      status: "fail",
      code: "auth_required",
    });
  });

  test("autofill shows a sign-in prompt and manual entry keeps the link", async ({
    page,
  }) => {
    const role = `__E2E_TEST__ Guest Engineer ${Date.now()}`;

    await page.goto("/applications");
    await page.getByTestId("add-application-button").first().click();

    await expect(page.getByTestId("autofill-sign-in-prompt")).toBeVisible();
    await expect(page.getByTestId("autofill-sign-in-button")).toBeVisible();
    await expect(page.getByTestId("autofill-button")).toHaveCount(0);

    await page.fill("#job-posting-url", JOB_LINK);
    await page.getByTestId("enter-manually-button").click();

    await expect(page.locator("input[name='link']")).toHaveValue(JOB_LINK);
    await page.fill("input[name='role_name']", role);
    await page.fill("input[name='company_name']", "__E2E_TEST__ Guest Co");
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "Company Site");
    await page.click("button[type='submit']:has-text('Add Application')");

    await expect(page.getByText(role).first()).toBeVisible();
  });

  test("the sign-in button opens the Clerk modal", async ({ page }) => {
    await page.goto("/applications");
    await page.getByTestId("add-application-button").first().click();
    await page.getByTestId("autofill-sign-in-button").click();

    await expect(page.locator(".cl-signIn-root, .cl-modalContent").first()).toBeVisible();
  });

  test("the ATS checker shows a sign-in gate", async ({ page }) => {
    await page.goto("/ats-checker");

    await expect(page.getByTestId("ats-sign-in-gate")).toBeVisible();
    await expect(page.getByRole("button", { name: /Run ATS Compatibility Scan/ })).toHaveCount(0);
  });
});

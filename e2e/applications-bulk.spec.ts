import { test, expect, type Page } from "@playwright/test";

// A bulk action is one server request, however many rows are selected.
test.describe("Bulk actions", () => {
  const stamp = Date.now();
  const tag = `__BULK__ ${stamp}`;

  async function addApplication(page: Page, role: string) {
    await page.getByTestId("add-application-button").first().click();
    const manual = page.getByTestId("enter-manually-button");
    if (await manual.isVisible().catch(() => false)) await manual.click();
    await page.fill("input[name='role_name']", role);
    await page.fill("input[name='company_name']", `${tag} Co`);
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "LinkedIn");
    await page.click("button[type='submit']:has-text('Add Application')");
    await expect(page.getByText(role).first()).toBeVisible();
  }

  test("deleting three selected applications sends one request", async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    for (const n of [1, 2, 3]) await addApplication(page, `${tag} Role ${n}`);

    // Show only these three, then select them
    await page.locator("input[placeholder*='Search']").first().fill(tag);
    await expect(page.getByTestId("table-row")).toHaveCount(3);
    await page.waitForLoadState("networkidle");
    await page.getByRole("checkbox", { name: "Select all" }).first().check();

    const actionRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"]) actionRequests.push(request.url());
    });

    await page.getByTestId("bulk-delete-button").click();
    await page.getByTestId("bulk-delete-confirm-button").click();
    await expect(page.getByText("Successfully deleted 3 application(s).").first()).toBeVisible();
    await expect(page.getByTestId("table-row")).toHaveCount(0);

    expect(actionRequests).toHaveLength(1);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Applications Timeline & Status History E2E Suite", () => {
  const timestamp = Date.now();
  const testRole = `__TIMELINE_TEST__ Senior Frontend Engineer ${timestamp}`;
  const testCompany = `__TIMELINE_TEST__ CloudCorp ${timestamp}`;

  test.beforeEach(async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
  });

  test("1. Verify Sequential Status Updates Stack Chronologically in Timeline", async ({ page }) => {
    // 1. Create fresh application
    const addBtn = page.getByTestId("add-application-button").first();
    await addBtn.click();
    await expect(page.locator("text=New Job Application")).toBeVisible();

    const enterManuallyBtn = page.getByTestId("enter-manually-button");
    if (await enterManuallyBtn.isVisible().catch(() => false)) {
      await enterManuallyBtn.click();
    }

    await page.fill("input[name='role_name']", testRole);
    await page.fill("input[name='company_name']", testCompany);
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "LinkedIn");
    await page.click("button[type='submit']:has-text('Add Application')");

    // Wait for row to appear
    await expect(page.locator(`text=${testRole}`).first()).toBeVisible();

    // 2. Open Detail Sheet
    const viewBtn = page
      .locator(`tr:has-text('${testRole}')`)
      .getByTestId("view-details-button")
      .first();
    await viewBtn.click({ force: true });

    await expect(page.locator("text=Application Timeline")).toBeVisible();

    // 3. Quick update to "Review"
    const quickStatusSelect = page.locator("#quick-status-select");
    await quickStatusSelect.click();
    const reviewOption = page
      .locator("[role='option']:has-text('Review'), [role='option']:has-text('In Review')")
      .first();
    await reviewOption.click();
    await expect(page.locator("text=Status updated").first()).toBeVisible();
    await page.waitForTimeout(500);

    // 4. Quick update to "Interview"
    await quickStatusSelect.click();
    const interviewOption = page
      .locator("[role='option']:has-text('Interview'), [role='option']:has-text('Interviewing')")
      .first();
    await interviewOption.click();
    await expect(page.locator("text=Status updated").first()).toBeVisible();
    await page.waitForTimeout(500);

    // 5. Verify Timeline contains stacked milestones
    await expect(page.getByTestId("timeline-entry").first()).toBeVisible();
    const count = await page.getByTestId("timeline-entry").count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Close detail sheet
    await page.keyboard.press("Escape");
  });

  test("2. Timeline Entry Deletion Guard with Inline Confirmation", async ({ page }) => {
    // Search for the app created in test 1
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await searchInput.fill(testRole);
    await expect(page.locator(`tr:has-text('${testRole}')`)).toBeVisible();

    await page
      .locator(`tr:has-text('${testRole}')`)
      .getByTestId("view-details-button")
      .first()
      .click({ force: true });

    // Deleting a timeline entry asks for an inline confirmation first
    await page.getByRole("button", { name: "Delete this timeline entry" }).first().click({ force: true });
    const confirmBtn = page.getByRole("button", { name: "Confirm delete timeline entry" });
    await expect(confirmBtn).toBeVisible();

    // Cancel keeps the entry
    const entries = await page.getByTestId("timeline-entry").count();
    await page.getByRole("button", { name: "Cancel delete" }).click();
    await expect(confirmBtn).not.toBeVisible();
    await expect(page.getByTestId("timeline-entry")).toHaveCount(entries);

    await page.keyboard.press("Escape");
  });
});

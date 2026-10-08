import { test, expect } from "@playwright/test";

test.describe("Analytics Page Overhaul & Usability", () => {
  // Helper to ensure at least one application exists for funnel testing
  async function ensureApplicationExists(page: any) {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("domcontentloaded");

    const addBtn = page.getByTestId("add-application-button").first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      const enterManuallyBtn = page.getByTestId("enter-manually-button");
      if (await enterManuallyBtn.isVisible().catch(() => false)) {
        await enterManuallyBtn.click();
      }
      await page.fill("input[name='role_name']", "__E2E_ANALYTICS__ Engineer");
      await page.fill("input[name='company_name']", "__E2E_ANALYTICS__ Corp");
      await page.fill("input[name='location']", "Remote");
      await page.fill("input[name='platform']", "LinkedIn");
      await page.click("button[type='submit']:has-text('Add Application')");
      await page.waitForTimeout(500);
    }
  }

  test("renders clean, human page header without AI-slop or follow-up reminders", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    // 1. Clean title and subtitle
    const heading = page.locator("h1", { hasText: "Analytics" }).first();
    await expect(heading).toBeVisible();

    const subtitle = page.locator("text=Track your job search progress, interview rates, and platform performance.").first();
    await expect(subtitle).toBeVisible();

    // 2. Ensure obsolete buzzword titles and follow-up reminders are completely gone
    await expect(page.locator("text=Pipeline Health & Conversion Velocity")).not.toBeVisible();
    await expect(page.locator("text=Strategic Intelligence & Analytics")).not.toBeVisible();
    await expect(page.locator("text=Action Pulse")).not.toBeVisible();
    await expect(page.locator("text=Follow-Up Reminders")).not.toBeVisible();
    await expect(page.locator("text=Screening Yield")).not.toBeVisible();
    await expect(page.locator("text=Response Velocity")).not.toBeVisible();
    await expect(page.locator("text=Market Reality Matrix")).not.toBeVisible();
  });

  test("displays 5 top-level KPI metric cards", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Total Applied").first()).toBeVisible();
    await expect(page.locator("text=In Progress").first()).toBeVisible();
    await expect(page.locator("text=Interview Rate").first()).toBeVisible();
    await expect(page.locator("text=Offers").first()).toBeVisible();
    await expect(page.locator("text=Avg. Response Time").first()).toBeVisible();
  });

  test("renders empty state or corrected 4-stage application funnel with consistent outcome stats", async ({ page }) => {
    await ensureApplicationExists(page);

    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    const funnelHeading = page.locator("h2", { hasText: "Application Funnel" }).first();
    await expect(funnelHeading).toBeVisible();

    await expect(page.locator("text=1. Applied").first()).toBeVisible();
    await expect(page.locator("text=2. Under Review").first()).toBeVisible();
    await expect(page.locator("text=3. Interview").first()).toBeVisible();
    await expect(page.locator("text=4. Offer").first()).toBeVisible();

    // Ensure Active Pipeline is NOT present as a funnel stage
    await expect(page.locator("text=2. Active Pipeline")).not.toBeVisible();

    // Outcomes row with consistent count formatting
    await expect(page.locator("text=Interview-to-Offer Conversion").first()).toBeVisible();
    await expect(page.locator("text=No Response (30+ Days)").first()).toBeVisible();
    await expect(page.locator("text=Rejections").first()).toBeVisible();
  });

  test("renders unified platform breakdown without direct portals sub-toggle", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    // Platforms & Sources section is visible directly on page
    await expect(page.locator("h2", { hasText: "Platforms & Sources" }).first()).toBeVisible();

    // Ensure artificial "Direct Portals" and "Job Boards" toggle buttons are gone
    await expect(page.locator("button:has-text('Direct Portals')")).not.toBeVisible();
    await expect(page.locator("button:has-text('Job Boards')")).not.toBeVisible();
    await expect(page.locator("text=ATS Domain")).not.toBeVisible();
  });

  test("renders work model and salary benchmarks without redundant status donut", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    // Work Model and Salary sections are visible on the dashboard
    await expect(page.locator("text=Work Model Breakdown").first()).toBeVisible();
    await expect(page.locator("text=Salary & Compensation").first()).toBeVisible();

    // Redundant status breakdown donut chart is gone
    await expect(page.locator("text=Status Breakdown")).not.toBeVisible();
  });
});

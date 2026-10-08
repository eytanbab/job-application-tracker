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

  test("renders clean, human page header without AI-slop jargon", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    // 1. Clean title and subtitle
    const heading = page.locator("h1", { hasText: "Analytics" }).first();
    await expect(heading).toBeVisible();

    const subtitle = page.locator("text=Track your job search progress, interview rates, and platform performance.").first();
    await expect(subtitle).toBeVisible();

    // 2. Ensure obsolete buzzword titles are completely gone
    await expect(page.locator("text=Pipeline Health & Conversion Velocity")).not.toBeVisible();
    await expect(page.locator("text=Strategic Intelligence & Analytics")).not.toBeVisible();
    await expect(page.locator("text=Action Pulse")).not.toBeVisible();
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

  test("renders empty state or corrected 4-stage application funnel", async ({ page }) => {
    // Ensure an application exists so funnel renders
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

    // Outcomes row
    await expect(page.locator("text=Interview-to-Offer Conversion").first()).toBeVisible();
    await expect(page.locator("text=No Response (30+ Days)").first()).toBeVisible();
    await expect(page.locator("text=Rejections").first()).toBeVisible();
  });

  test("persists tab navigation in URL search params", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("domcontentloaded");

    // Check initial tab: Platforms
    const platformsTab = page.locator("#tab-platforms");
    await expect(platformsTab).toHaveAttribute("aria-selected", "true");

    // Click Trends & Status tab
    const trendsTab = page.locator("#tab-trends");
    await trendsTab.click();
    await expect(trendsTab).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/tab=trends/);

    // Verify trends content is displayed
    await expect(page.locator("#panel-trends")).toBeVisible();

    // Click Work & Salary tab
    const workTab = page.locator("#tab-workplace");
    await workTab.click();
    await expect(workTab).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/tab=workplace/);

    // Verify workplace content is displayed
    await expect(page.locator("#panel-workplace")).toBeVisible();
  });
});

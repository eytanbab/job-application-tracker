import { test, expect, type Page } from "@playwright/test";

test.describe("Analytics page", () => {
  // Most checks need at least one application in the last 90 days
  async function ensureApplicationExists(page: Page) {
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

  test.beforeAll(async ({ browser }, testInfo) => {
    // The first visit compiles the add-application form on a cold dev server
    testInfo.setTimeout(120_000);
    const page = await browser.newPage();
    await ensureApplicationExists(page);
    await page.close();
  });

  test("shows the header and the three questions the page answers", async ({ page }) => {
    await page.goto("/analytics/overview");

    await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Track your job search progress, interview rates, and platform performance.")).toBeVisible();
    for (const name of ["How am I doing", "Where is it stuck", "What works", "Activity"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }

    // Retired sections stay gone
    await expect(page.getByText("Offers Received")).not.toBeVisible();
    await expect(page.getByText("Market Reality Matrix")).not.toBeVisible();
  });

  test("shows five KPI tiles that open the matching applications", async ({ page }) => {
    await page.goto("/analytics/overview");
    const section = page.getByRole("region", { name: "How am I doing" });
    for (const label of ["Applications", "Response rate", "Interview rate", "Offers", "Days to first reply"]) {
      await expect(section.getByRole("term").getByText(label, { exact: true })).toBeVisible();
    }

    await page.waitForLoadState("networkidle");
    await section.getByRole("link", { name: /Interview rate/ }).click();
    await expect(page).toHaveURL(/\/applications\?.*stage=interviewed/);
    await expect(page.getByText("Filtered from Analytics:")).toBeVisible();
  });

  test("shows the pipeline as four linked stages with exits", async ({ page }) => {
    await page.goto("/analytics/overview");
    const section = page.getByRole("region", { name: "Where is it stuck" });
    const stages = section.getByRole("list").first().getByRole("listitem");
    await expect(stages).toHaveCount(4);
    await expect(stages.nth(0)).toContainText("Applied");
    await expect(stages.nth(2)).toContainText("Reached interview");
    for (const exit of ["Rejected", "Ghosted", "Still open"]) {
      await expect(section.getByText(exit, { exact: true })).toBeVisible();
    }
    await expect(section.getByRole("heading", { name: "Needs action" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Time between steps" })).toBeVisible();
  });

  test("sorts platforms from the URL and keeps the order on reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/analytics/overview");
    const table = page.getByRole("region", { name: "What works" }).getByRole("table");
    await expect(table.getByRole("columnheader", { name: /Applications/ })).toHaveAttribute("aria-sort", "descending");

    await page.waitForLoadState("networkidle");
    await table.getByRole("button", { name: "Platform" }).click();
    await expect(page).toHaveURL(/psort=platform/);
    await page.reload();
    await expect(table.getByRole("columnheader", { name: /Platform/ }).first()).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  test("shows work model, resume and salary panels", async ({ page }) => {
    await page.goto("/analytics/overview");
    const section = page.getByRole("region", { name: "What works" });
    for (const name of ["Work model", "Resume versions", "Salary"]) {
      await expect(section.getByRole("heading", { level: 3, name })).toBeVisible();
    }
  });

  test("keeps the chosen period in the URL across reloads", async ({ page }) => {
    await page.goto("/analytics/overview");
    await expect(page.getByRole("radio", { name: "Last 90 days" })).toHaveAttribute("aria-checked", "true");

    // The presets are buttons, so they only respond once hydration finishes.
    await page.waitForLoadState("networkidle");
    await page.getByRole("radio", { name: "Last 30 days" }).click();
    await expect(page).toHaveURL(/range=30d/);
    await page.reload();
    await expect(page.getByRole("radio", { name: "Last 30 days" })).toHaveAttribute("aria-checked", "true");
  });

  test("exports the selected period as CSV", async ({ page }) => {
    await page.goto("/analytics/overview?range=30d");
    const link = page.getByRole("link", { name: /Export CSV of applications, Last 30 days/ });
    await expect(link).toHaveAttribute("href", "/api/analytics/export?range=30d");

    const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
    expect(download.suggestedFilename()).toMatch(/^job-applications-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test("redirects old month/year links to a date range", async ({ page }) => {
    await page.goto("/analytics/overview?month=10&year=2026");
    await expect(page).toHaveURL(/range=custom&from=2026-10-01&to=2026-10-31/);

    await page.goto("/analytics/insights?month=3");
    await expect(page).toHaveURL(/\/analytics\/overview\?range=all$/);
  });

  test("offers a way out of an empty period", async ({ page }) => {
    await page.goto("/analytics/overview?range=custom&from=2000-01-01&to=2000-01-31");
    await expect(page.getByRole("heading", { name: "No applications in this period" })).toBeVisible();
    // A click before hydration finishes is dropped by the client router.
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Show all time" }).click();
    await expect(page).toHaveURL(/range=all/);
    await expect(page.getByRole("heading", { level: 2, name: "How am I doing" })).toBeVisible();
  });

  test("saves a weekly goal and shows progress against it", async ({ page }) => {
    await page.goto("/analytics/overview");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Set a weekly goal|Change goal/ }).click();
    await page.getByLabel("Applications per week").fill("7");
    await page.getByRole("button", { name: "Save goal" }).click();
    await expect(page.getByText(/This week: \d+ of 7 applications/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/This week: \d+ of 7 applications/)).toBeVisible();
    await page.goto("/settings");
    await expect(page.getByLabel("Weekly application goal")).toHaveValue("7");
  });

  test("describes the activity chart and offers it as a table", async ({ page }) => {
    await page.goto("/analytics/overview");
    const section = page.getByRole("region", { name: "Activity" });
    await expect(section.getByRole("img", { name: /applications over \d+ weeks/ })).toBeVisible();
    await expect(section.getByRole("radio", { name: "By status" })).toHaveAttribute("aria-checked", "true");

    await page.waitForLoadState("networkidle");
    await section.getByRole("radio", { name: "Total" }).click();
    await expect(page).toHaveURL(/view=total/);
    await section.getByRole("button", { name: "Show as table" }).click();
    await expect(section.getByRole("table")).toBeVisible();
    await expect(section.getByRole("columnheader", { name: "Week of" })).toBeVisible();
  });

  test("shows insights from the data on load", async ({ page }) => {
    await page.goto("/analytics/overview");
    const section = page.getByRole("region", { name: "How am I doing" });
    await expect(section.getByRole("heading", { name: "Insights" })).toBeVisible();
    await expect(section.getByText(/You sent \d+ applications? in the last 7 days, against \d+ the week before\./)).toBeVisible();

    // A follow-up insight opens the matching applications in the tracker
    const followUp = section.getByRole("link", { name: /had no update for 7 days or more/ });
    await expect(followUp).toHaveAttribute("href", "/applications?status=interview");
    await page.waitForLoadState("networkidle");
    await followUp.click();
    await expect(page).toHaveURL(/\/applications\?status=interview/);
  });
});

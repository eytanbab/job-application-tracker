import { test, expect, type Page } from "@playwright/test";

// The detail sheet keeps a saved copy and an unsaved draft. These tests cover
// the cases where the two used to get mixed up.
test.describe("Application detail sheet state", () => {
  const stamp = Date.now();

  async function addApplication(page: Page, role: string) {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("add-application-button").first().click();
    const manual = page.getByTestId("enter-manually-button");
    if (await manual.isVisible().catch(() => false)) await manual.click();
    await page.fill("input[name='role_name']", role);
    await page.fill("input[name='company_name']", `__DETAIL__ Co ${stamp}`);
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "LinkedIn");
    await page.click("button[type='submit']:has-text('Add Application')");
    await expect(page.getByText(role).first()).toBeVisible();
  }

  async function openApplication(page: Page, role: string) {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    await page.locator(`tr:has-text('${role}')`).getByTestId("view-details-button").first().click({ force: true });
    await expect(page.getByRole("dialog").getByText(role).first()).toBeVisible();
  }

  async function chooseStage(page: Page, label: string) {
    await page.locator("#quick-status-select").click();
    await page.getByRole("option", { name: label, exact: true }).click();
  }

  test("changing the stage saves only the stage and keeps unsaved edits", async ({ page }) => {
    const role = `__DETAIL__ Draft Engineer ${stamp}`;
    await addApplication(page, role);
    await openApplication(page, role);
    const dialog = page.getByRole("dialog");

    // An unsaved inline edit to the title
    await dialog.getByTitle("Click to edit role name").click();
    await dialog.getByPlaceholder("Role title").fill(`${role} EDITED`);
    await dialog.getByPlaceholder("Role title").press("Enter");
    await expect(dialog.getByText("You have unsaved changes")).toBeVisible();

    // The stage change saves, and the page refreshes behind the sheet
    await chooseStage(page, "In Review");
    await expect(page.getByText(/Status updated/).first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    // The draft survives the refresh and is still unsaved
    await expect(dialog.getByText(`${role} EDITED`)).toBeVisible();
    await expect(dialog.getByText("You have unsaved changes")).toBeVisible();

    // On the server, only the stage changed
    await openApplication(page, role);
    await expect(page.getByRole("dialog").getByText(`${role} EDITED`)).toHaveCount(0);
    await expect(page.locator("#quick-status-select")).toContainText("In Review");
  });

  test("moving to the next application right after a stage change shows that application's timeline", async ({ page }) => {
    const first = `__DETAIL__ Race A ${stamp}`;
    const second = `__DETAIL__ Race B ${stamp}`;
    await addApplication(page, second);
    await addApplication(page, first);

    // Newest first: the first row is A, the next is B
    await openApplication(page, first);

    // Hold A's save so J is pressed while it is in flight. Server actions run
    // one at a time, so B's timeline loads before A's post-save reload.
    let holdNext = true;
    await page.route("**/applications**", async (route) => {
      if (holdNext && route.request().method() === "POST" && route.request().headers()["next-action"]) {
        holdNext = false;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await route.continue();
    });
    await chooseStage(page, "Rejected");
    await page.keyboard.press("j");

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(second).first()).toBeVisible();
    // A's save and its timeline reload finish after B's timeline loaded
    await expect(page.getByText(/Status updated/).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // B was never rejected, so its timeline must not show a Rejected entry
    const entries = dialog.getByTestId("timeline-entry");
    await expect(entries.first()).toBeVisible();
    await expect(entries.filter({ hasText: "Rejected" })).toHaveCount(0);
  });
});

import { test, expect } from "@playwright/test";

test.describe("Applications Form Dirty State Guard E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
  });

  test("1. Edit Form Prompts Discard Confirmation Dialog When Changes are Unsaved", async ({ page }) => {
    // Open edit application dialog on first row
    const editBtn = page.getByTestId("edit-application-button").first();
    if (await editBtn.isVisible()) {
      await editBtn.click({ force: true });
      await expect(page.locator("text=Edit Job Application")).toBeVisible();

      // Modify notes
      const notesField = page.locator("textarea[name='notes']");
      await notesField.fill(`Modified notes ${Date.now()}`);

      // Click Cancel button
      const cancelBtn = page.locator("button:has-text('Cancel')").first();
      await cancelBtn.click();

      // Expect discard confirmation dialog
      await expect(page.locator("text=Discard unsaved changes?")).toBeVisible();
      await expect(
        page.locator("text=You have unsaved changes. Are you sure you want to discard them?")
      ).toBeVisible();

      // Click 'Keep Editing'
      await page.click("button:has-text('Keep Editing')");
      await expect(page.locator("text=Discard unsaved changes?")).not.toBeVisible();
      await expect(page.locator("text=Edit Job Application")).toBeVisible();

      // Click Cancel again and choose 'Discard Changes'
      await cancelBtn.click();
      await page.click("button:has-text('Discard Changes')");
      await expect(page.locator("text=Edit Job Application")).not.toBeVisible();
    }
  });
});

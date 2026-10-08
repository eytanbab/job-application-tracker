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
      const notesField = page.locator("textarea[name='notes']").first();
      await notesField.fill(`Modified notes ${Date.now()}`);

      // First Cancel attempt: dismiss dialog (Keep editing)
      const cancelBtn = page.locator("button:has-text('Cancel')").first();
      await cancelBtn.click();

      await expect(page.locator("text=Discard Unsaved Changes?")).toBeVisible();
      await page.locator("button:has-text('Keep Editing')").click();
      await expect(page.locator("text=Edit Job Application")).toBeVisible();

      // Second Cancel attempt: accept dialog (Discard changes)
      await cancelBtn.click();
      await expect(page.locator("text=Discard Unsaved Changes?")).toBeVisible();
      await page.locator("button:has-text('Discard Changes')").click();
      await expect(page.locator("text=Edit Job Application")).not.toBeVisible();
    }
  });
});

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
      let dialogMessage = "";
      page.once("dialog", async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.dismiss();
      });

      const cancelBtn = page.locator("button:has-text('Cancel')").first();
      await cancelBtn.click();

      expect(dialogMessage).toContain("You have unsaved changes. Are you sure you want to discard them?");
      await expect(page.locator("text=Edit Job Application")).toBeVisible();

      // Second Cancel attempt: accept dialog (Discard changes)
      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });

      await cancelBtn.click();
      await expect(page.locator("text=Edit Job Application")).not.toBeVisible();
    }
  });
});

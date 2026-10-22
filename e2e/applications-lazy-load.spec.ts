import { test, expect } from "@playwright/test";

// The add form loads on demand. If its code fails to download, the user
// gets an error and can try again, instead of a dialog that never opens.
test("a failed load of the add form shows an error and retries on the next click", async ({ page }) => {
  // No idle preload, so the form loads when the button is clicked
  await page.addInitScript(() => {
    window.requestIdleCallback = () => 0;
    window.cancelIdleCallback = () => {};
  });
  await page.goto("/applications?view=table");
  await page.waitForLoadState("networkidle");

  // Every script requested from now on fails
  await page.route("**/_next/static/chunks/**", (route) => route.abort());
  await page.getByTestId("add-application-button").first().click();
  await expect(page.getByText("Couldn't open this. Check your connection and try again.", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.unroute("**/_next/static/chunks/**");
  await page.getByTestId("add-application-button").first().click();
  await expect(page.getByRole("dialog").getByText("New Job Application")).toBeVisible();
});

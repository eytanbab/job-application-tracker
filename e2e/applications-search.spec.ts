import { test, expect } from "@playwright/test";

// The search box keeps typed text locally and sends it after a pause. These
// tests cover the cases where the URL and the box could disagree.
test.describe("Applications search box", () => {
  test("slow typing keeps every character while earlier searches load", async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    const search = page.getByPlaceholder("Search applications...");

    // Each pause is longer than the debounce, so every character sends a
    // search, and its reload arrives while the next one is typed.
    await search.pressSequentially("enginee", { delay: 350 });
    await expect(search).toHaveValue("enginee");
    await expect(page).toHaveURL(/q=enginee(&|$)/);
  });

  test("typing fast sends one search after the pause", async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    const search = page.getByPlaceholder("Search applications...");

    await search.pressSequentially("acme", { delay: 30 });
    // Not sent yet
    expect(page.url()).not.toContain("q=");
    await expect(page).toHaveURL(/q=acme/);
  });

  test("resetting filters empties the box", async ({ page }) => {
    await page.goto("/applications?view=table&q=acme");
    await page.waitForLoadState("networkidle");
    const search = page.getByPlaceholder("Search applications...");
    await expect(search).toHaveValue("acme");

    await page.getByRole("button", { name: "Reset all filters" }).first().click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(search).toHaveValue("");
  });

  test("the clear button empties the box and the search at once", async ({ page }) => {
    await page.goto("/applications?view=table&q=acme");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Clear search filter" }).click();
    await expect(page.getByPlaceholder("Search applications...")).toHaveValue("");
    await expect(page).not.toHaveURL(/q=/);
  });
});

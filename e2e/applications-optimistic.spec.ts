import { test, expect, type Page } from "@playwright/test";

// Moves and deletes show before the server answers. Each test holds the
// server's reply for 3 seconds and checks the change is already visible.
test.describe("Instant moves and deletes", () => {
  const stamp = Date.now();

  async function addApplication(page: Page, role: string) {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("add-application-button").first().click();
    const manual = page.getByTestId("enter-manually-button");
    if (await manual.isVisible().catch(() => false)) await manual.click();
    await page.fill("input[name='role_name']", role);
    await page.fill("input[name='company_name']", `__OPTIMISTIC__ Co ${stamp}`);
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "LinkedIn");
    await page.click("button[type='submit']:has-text('Add Application')");
    await expect(page.getByText(role).first()).toBeVisible();
  }

  /**
   * Delays the next server action's response. Returns { sent }, a promise
   * that resolves once the request goes out (wrapped, so awaiting this
   * function does not also wait for it).
   */
  async function holdNextAction(page: Page, ms = 3000) {
    let release!: () => void;
    const sent = new Promise<void>((resolve) => (release = resolve));
    let held = false;
    await page.route("**/applications**", async (route) => {
      if (!held && route.request().method() === "POST" && route.request().headers()["next-action"]) {
        held = true;
        release();
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
      await route.continue();
    });
    return { sent };
  }

  test("a card moved on the board changes column before the server answers", async ({ page }) => {
    const role = `__OPTIMISTIC__ Move ${stamp}`;
    await addApplication(page, role);
    await page.goto("/applications?view=kanban");
    await page.waitForLoadState("networkidle");

    const board = page.getByTestId("kanban-column-rejected").last();
    const card = page.getByRole("article", { name: new RegExp(`^Application for ${role}`) }).last();
    await expect(card).toBeVisible();

    const { sent } = await holdNextAction(page);
    await card.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Change Status" }).hover();
    await page.getByRole("menuitem", { name: "Rejected", exact: true }).click();
    await sent;

    // Still waiting on the server, and the card is already in Rejected
    await expect(board.getByText(role)).toBeVisible({ timeout: 1000 });
    await expect(page.getByTestId("kanban-column-applied").last().getByText(role)).toHaveCount(0);

    // And it stays there once the server answers
    await expect(page.getByText(/Moved ".*" to Rejected/).first()).toBeVisible({ timeout: 10000 });
    await expect(board.getByText(role)).toBeVisible();
  });

  test("a deleted row disappears before the server answers", async ({ page }) => {
    const role = `__OPTIMISTIC__ Delete ${stamp}`;
    await addApplication(page, role);
    const row = page.locator(`tr:has-text('${role}')`);
    await expect(row).toBeVisible();

    const { sent } = await holdNextAction(page);
    await row.getByTestId("row-actions-button").click();
    await page.getByTestId("delete-application-button").click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete Application" }).click();
    await sent;

    await expect(row).toHaveCount(0, { timeout: 1000 });
    await expect(page.getByText("Application deleted.").first()).toBeVisible({ timeout: 10000 });
    await expect(row).toHaveCount(0);
  });

  test("a move that fails puts the card back", async ({ page }) => {
    const role = `__OPTIMISTIC__ Fail ${stamp}`;
    await addApplication(page, role);
    await page.goto("/applications?view=kanban");
    await page.waitForLoadState("networkidle");
    const card = page.getByRole("article", { name: new RegExp(`^Application for ${role}`) }).last();
    await expect(card).toBeVisible();

    // The server action never arrives
    await page.route("**/applications**", async (route) => {
      if (route.request().method() === "POST" && route.request().headers()["next-action"]) return route.abort();
      return route.continue();
    });
    await card.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Change Status" }).hover();
    await page.getByRole("menuitem", { name: "Rejected", exact: true }).click();

    await expect(page.getByText("Failed to move application").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("kanban-column-applied").last().getByText(role)).toBeVisible();
    await expect(page.getByTestId("kanban-column-rejected").last().getByText(role)).toHaveCount(0);
  });
});

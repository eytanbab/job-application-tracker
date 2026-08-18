import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const authDir = path.resolve(process.cwd(), "e2e/.auth");
const authFile = path.join(authDir, "user.json");

setup("authenticate as test user", async ({ page }) => {
  setup.setTimeout(60000);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const email = process.env.E2E_USER_EMAIL || "testuser@gmail.com";
  const password = process.env.E2E_USER_PASSWORD || "123456";

  console.log(`[E2E Setup] Logging in as ${email}...`);

  await page.goto("/sign-in");
  await page.waitForLoadState("domcontentloaded");

  // Wait for Clerk email input
  const emailInput = page.locator("#identifier-field, input[name='identifier'], input[type='email']").first();
  await expect(emailInput).toBeVisible({ timeout: 25000 });
  await emailInput.fill(email);
  await emailInput.press("Enter");

  // Wait for Clerk password input
  const passwordInput = page.locator("#password-field, input[name='password'], input[type='password']").first();
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await passwordInput.fill(password);
  await passwordInput.press("Enter");

  // Wait for redirect to /applications
  await page.waitForURL((url) => url.pathname.includes("/applications") || url.pathname === "/", { timeout: 25000 });

  if (!page.url().includes("/applications")) {
    await page.goto("/applications");
  }
  await page.waitForLoadState("networkidle");

  // Verify we are authenticated on /applications
  await expect(page.locator("text=Job Applications").first()).toBeVisible({ timeout: 10000 });

  // Save the authenticated cookies & localStorage state
  await page.context().storageState({ path: authFile });
  console.log(`[E2E Setup] Authentication state successfully saved to ${authFile}`);
});

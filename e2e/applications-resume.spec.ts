import { test, expect } from "@playwright/test";

test.describe("Resume Attachment, Deduplication & Safety Guard E2E Suite", () => {
  const dummyPdfBuffer = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF",
  );

  test("End-to-End: Upload resume, deduplicate on second app, and warn on deletion", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const testResumeFileName = `e2e_resume_${timestamp}.pdf`;
    const company1 = `__E2E_TEST__ Corp Alpha ${timestamp}`;
    const company2 = `__E2E_TEST__ Corp Beta ${timestamp}`;

    // --- STEP 1: Create first application with uploaded resume ---
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");

    const addBtn = page.getByTestId("add-application-button").first();
    await addBtn.click();

    const enterManuallyBtn = page.getByTestId("enter-manually-button");
    if (await enterManuallyBtn.isVisible().catch(() => false)) {
      await enterManuallyBtn.click();
    }

    // Expand optional fields
    const moreDetailsBtn = page.locator("button:has-text('+ Add More Details')");
    if (await moreDetailsBtn.isVisible().catch(() => false)) {
      await moreDetailsBtn.click();
    }

    // Toggle inline resume upload
    const uploadNewPdfBtn = page.locator("button:has-text('Upload New PDF')");
    await expect(uploadNewPdfBtn).toBeVisible();
    await uploadNewPdfBtn.click();

    // Select file to upload
    const fileInput = page.getByTestId("resume-file-input");
    await fileInput.setInputFiles({
      name: testResumeFileName,
      mimeType: "application/pdf",
      buffer: dummyPdfBuffer,
    });

    // Upload & attach
    const uploadAndAttachBtn = page.locator("button:has-text('Upload & Attach')");
    await expect(uploadAndAttachBtn).toBeVisible();
    await uploadAndAttachBtn.click();

    // Expect upload success notification
    await expect(
      page.locator("text=Resume uploaded and attached!").first(),
    ).toBeVisible({ timeout: 15000 });

    // Fill required application fields
    await page.fill("input[name='role_name']", `Staff Engineer ${timestamp}`);
    await page.fill("input[name='company_name']", company1);
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "LinkedIn");

    await page.click("button[type='submit']:has-text('Add Application')");
    await page.waitForTimeout(500);

    // Verify row appears in table
    const row1 = page
      .locator(`[data-testid='table-row']:has-text('${company1}')`)
      .first();
    await expect(row1).toBeVisible();

    // Open detail sheet and verify resume is attached
    await row1.click();
    await expect(
      page.getByRole("heading", { name: "Applied Resume" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // --- STEP 2: Create second application with the SAME resume, verifying deduplication ---
    await addBtn.click();
    if (await enterManuallyBtn.isVisible().catch(() => false)) {
      await enterManuallyBtn.click();
    }

    const moreDetailsBtn2 = page.locator("button:has-text('+ Add More Details')");
    if (await moreDetailsBtn2.isVisible().catch(() => false)) {
      await moreDetailsBtn2.click();
    }

    const uploadNewPdfBtn2 = page.locator("button:has-text('Upload New PDF')");
    await expect(uploadNewPdfBtn2).toBeVisible();
    await uploadNewPdfBtn2.click();

    // Upload the identical resume
    const fileInput2 = page.getByTestId("resume-file-input");
    await fileInput2.setInputFiles({
      name: testResumeFileName,
      mimeType: "application/pdf",
      buffer: dummyPdfBuffer,
    });

    // Deduplication warning banner should appear
    await expect(
      page.locator("text=Resume already in your library").first(),
    ).toBeVisible({ timeout: 10000 });

    const useExistingBtn = page.locator(
      "button:has-text('Use Existing Copy (Recommended)')",
    );
    await expect(useExistingBtn).toBeVisible();
    await useExistingBtn.click();

    // Notification confirms reuse of existing copy
    await expect(
      page.locator("text=Attached existing copy").first(),
    ).toBeVisible();

    // Complete second application
    await page.fill(
      "input[name='role_name']",
      `Principal Engineer ${timestamp}`,
    );
    await page.fill("input[name='company_name']", company2);
    await page.fill("input[name='location']", "Remote");
    await page.fill("input[name='platform']", "LinkedIn");

    await page.click("button[type='submit']:has-text('Add Application')");
    await page.waitForTimeout(500);

    const row2 = page
      .locator(`[data-testid='table-row']:has-text('${company2}')`)
      .first();
    await expect(row2).toBeVisible();

    // --- STEP 3: Verify document usage warning in Documents library ---
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");

    const docRow = page
      .locator("tr", { hasText: testResumeFileName.replace(".pdf", "") })
      .first();
    await expect(docRow).toBeVisible();

    const deleteBtn = docRow.locator("button[title='Remove Document']");
    await deleteBtn.click();

    // Modal must indicate that document is attached to both applications
    await expect(
      page.getByRole("heading", { name: "Delete Document" }),
    ).toBeVisible();
    await expect(
      page.locator("text=Attached to 2 Job Applications"),
    ).toBeVisible({ timeout: 10000 });

    // Cancel deletion so document remains safe
    const cancelBtn = page.locator("button:has-text('Cancel')").first();
    await cancelBtn.click();
    await expect(
      page.getByRole("heading", { name: "Delete Document" }),
    ).not.toBeVisible();
  });
});

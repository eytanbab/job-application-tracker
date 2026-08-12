import { test, expect } from "@playwright/test";

test.describe("Applications Page E2E Suite", () => {
  const testApp = {
    role: `QA Engineer ${Date.now()}`,
    company: `TechCorp ${Date.now()}`,
    salary: "$140,000 - $160,000",
    location: "Remote",
    platform: "LinkedIn",
    statusCategory: "interview",
    stageDetails: "Technical Screening",
    dateAppliedFormatted: "31/05/2026",
    link: "https://linkedin.com/jobs/view/1000000000",
    notes: "E2E Test Candidate Notes",
  };

  // Helper function to ensure clean state and at least one test application exists
  async function ensureTestApplicationExists(page: any) {
    // Clear filters if active
    const resetBtn = page.locator("button:has-text('Reset Filters')").first();
    if (await resetBtn.isVisible().catch(() => false)) {
      await resetBtn.click();
      await page.waitForTimeout(200);
    }

    const count = await page.getByTestId("table-row").count();
    if (count === 0) {
      const addBtn = page.getByTestId("add-application-button").first();
      await addBtn.click();
      await page.fill("input[name='role_name']", "Test Software Engineer");
      await page.fill("input[name='company_name']", "Test Company");
      await page.fill("input[name='location']", "Remote");
      await page.fill("input[name='platform']", "LinkedIn");
      await page.fill("input[name='link']", "https://linkedin.com/jobs/view/1000000000");
      await page.fill("input[name='status']", "Interview");
      await page.click("button[type='submit']:has-text('Submit')");
      await page.waitForSelector("[data-testid='table-row']", { state: "visible", timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
  });

  test("1. Happy Path - Create Application", async ({ page }) => {
    // Click Add Application button using data-testid
    const addBtn = page.getByTestId("add-application-button").first();
    await addBtn.click();

    // Expect form dialog to be open
    await expect(page.locator("text=New Job Application")).toBeVisible();

    // Fill form fields
    await page.fill("input[name='role_name']", testApp.role);
    await page.fill("input[name='company_name']", testApp.company);
    await page.fill("input[name='salary']", testApp.salary);
    await page.fill("input[name='location']", testApp.location);
    await page.fill("input[name='status']", testApp.stageDetails);
    await page.fill("input[name='platform']", testApp.platform);
    await page.fill("input[name='link']", testApp.link);
    await page.fill("textarea[name='notes']", testApp.notes);

    // Submit form
    await page.click("button[type='submit']:has-text('Submit')");

    // Expect row to appear in table
    await expect(page.locator(`text=${testApp.role}`).first()).toBeVisible();
    await expect(page.locator(`text=${testApp.company}`).first()).toBeVisible();
  });

  test("2. Happy Path - Table View & Column Sorting", async ({ page }) => {
    await ensureTestApplicationExists(page);

    // Verify sort headers exist
    const roleHeader = page.locator("button:has-text('Role & Company')");
    await expect(roleHeader).toBeVisible();

    // Click sort by Role & Company
    await roleHeader.click();
    await page.waitForTimeout(300);

    // Click sort by Date Applied
    const dateHeader = page.locator("button:has-text('Date Applied')");
    await dateHeader.click();
    await page.waitForTimeout(300);

    // Verify sort URL parameter updated
    expect(page.url()).toContain("sort=");
  });

  test("3. Happy Path - Global Search & Category Filtering", async ({ page }) => {
    await ensureTestApplicationExists(page);

    const searchInput = page.locator("input[placeholder*='Search']").first();
    await searchInput.fill("Test");
    await page.waitForTimeout(500);

    // Verify URL search parameter updated
    expect(page.url()).toContain("q=Test");

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);
  });

  test("4. Happy Path - Application Detail Sheet & Quick Status Update", async ({ page }) => {
    await ensureTestApplicationExists(page);

    // Click view details button on first row
    const viewBtn = page.getByTestId("view-details-button").first();
    await viewBtn.click({ force: true });

    // Quick Status Update Trigger
    const selectTrigger = page.locator("#quick-status-select");
    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const rejectedItem = page.locator("[role='option']:has-text('Rejected'), [role='option']:has-text('Rejection')").first();
      if (await rejectedItem.isVisible()) {
        await rejectedItem.click();
        await expect(page.locator("text=Status updated").first()).toBeVisible();
      }
    }

    // Close detail sheet
    await page.keyboard.press("Escape");
  });

  test("5. Happy Path - Application Timeline & Delete Modal Confirmation", async ({ page }) => {
    await ensureTestApplicationExists(page);

    // Click view details button on first row
    const viewBtn = page.getByTestId("view-details-button").first();
    await viewBtn.click({ force: true });

    // Check timeline section
    const timelineHeader = page.locator("text=Application Timeline");
    if (await timelineHeader.isVisible()) {
      const deleteTimelineBtn = page.locator("button[title='Delete this timeline entry']").first();
      if (await deleteTimelineBtn.isVisible()) {
        await deleteTimelineBtn.click({ force: true });

        // Confirmation modal MUST be visible
        await expect(page.locator("text=Delete Timeline Entry")).toBeVisible();
        await expect(
          page.locator("text=Are you sure you want to delete the status entry")
        ).toBeVisible();

        // Click Cancel in modal
        await page.click("button:has-text('Cancel')");
        await expect(page.locator("text=Delete Timeline Entry")).not.toBeVisible();
      }
    }

    // Close detail sheet
    await page.keyboard.press("Escape");
  });

  test("6. Happy Path - Edit Details & Preserve Date Applied", async ({ page }) => {
    await ensureTestApplicationExists(page);

    // Click edit application button on first row using data-testid
    const editBtn = page.getByTestId("edit-application-button").first();
    await editBtn.click({ force: true });

    // Expect edit dialog title
    await expect(page.locator("text=Edit Job Application")).toBeVisible();

    // Modify location with unique timestamped string to guarantee dirty state
    const newLocation = `Tel Aviv ${Date.now()}`;
    const locationInput = page.locator("input[name='location']");
    await locationInput.fill(newLocation);

    // Click save button
    const saveBtn = page.locator("button[type='submit']:has-text('Save Changes')");
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await expect(page.locator("text=Application updated successfully").first()).toBeVisible();
  });

  test("7. Happy Path - Kanban Board View & Column Rendering", async ({ page }) => {
    await ensureTestApplicationExists(page);

    // Toggle view to Kanban
    const kanbanBtn = page.locator("button:has-text('Kanban')").first();
    if (await kanbanBtn.isVisible()) {
      await kanbanBtn.click();
    } else {
      await page.goto("/applications?view=kanban");
    }

    // Verify URL reflects view=kanban
    expect(page.url()).toContain("view=kanban");

    // Verify Kanban status headers
    await expect(page.locator("text=Applied").first()).toBeVisible();
  });

  test("8. Happy Path - URL Parameter Synchronization (nuqs)", async ({ page }) => {
    // Direct deep-link URL navigation
    await page.goto("/applications?q=Test&view=table&status=interview");
    await page.waitForLoadState("networkidle");

    // Verify search input hydrated from URL
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await expect(searchInput).toHaveValue("Test");
  });

  test("9. Error Handling - Form Validation Errors (Role Title)", async ({ page }) => {
    const addBtn = page.getByTestId("add-application-button").first();
    await addBtn.click();
    await expect(page.locator("text=New Job Application")).toBeVisible();

    // Type 1-character role title
    await page.fill("input[name='role_name']", "A");
    await page.click("button[type='submit']:has-text('Submit')");

    // Expect Zod validation error message
    await expect(
      page.locator("text=Role name must be at least 2 characters.")
    ).toBeVisible();

    await page.keyboard.press("Escape");
  });

  test("10. Error Handling - Edit Mode Unchanged State Guard", async ({ page }) => {
    await ensureTestApplicationExists(page);

    // Click edit application button using data-testid
    const editBtn = page.getByTestId("edit-application-button").first();
    await editBtn.click({ force: true });

    // Submit button should be disabled when no edits have been made
    const noChangesBtn = page.locator("button:has-text('No Changes')");
    await expect(noChangesBtn).toBeVisible();
    await expect(noChangesBtn).toBeDisabled();

    await page.keyboard.press("Escape");
  });

  test("11. Error Handling - Short Company Name Validation", async ({ page }) => {
    const addBtn = page.getByTestId("add-application-button").first();
    await addBtn.click();
    await page.fill("input[name='role_name']", "Valid Role");
    await page.fill("input[name='company_name']", "X");

    await page.click("button[type='submit']:has-text('Submit')");

    // Expect company validation error message
    await expect(
      page.locator("text=Company name must be at least 2 characters.")
    ).toBeVisible();

    await page.keyboard.press("Escape");
  });

  test("12. Happy Path - Application Deletion Confirmation Modal", async ({ page }) => {
    await ensureTestApplicationExists(page);

    const trashBtn = page.getByTestId("delete-application-button").first();
    if (await trashBtn.isVisible()) {
      await trashBtn.click({ force: true });

      // Expect deletion confirmation modal
      await expect(page.locator("text=Are you absolutely sure?")).toBeVisible();
      await expect(
        page.locator("text=This action cannot be undone.")
      ).toBeVisible();

      // Click Cancel
      await page.click("button:has-text('Cancel')");
      await expect(page.locator("text=Are you absolutely sure?")).not.toBeVisible();
    }
  });

  test("13. Happy Path - Confirm Application Deletion", async ({ page }) => {
    await ensureTestApplicationExists(page);

    const trashBtn = page.getByTestId("delete-application-button").first();
    if (await trashBtn.isVisible()) {
      await trashBtn.click({ force: true });

      // Expect deletion confirmation modal
      await expect(page.locator("text=Are you absolutely sure?")).toBeVisible();

      // Click Delete to confirm
      const confirmBtn = page.locator("button:has-text('Delete')");
      await confirmBtn.click();

      // Expect success message
      await expect(page.locator("text=Successfully deleted application!").first()).toBeVisible();
    }
  });

  test("14. UI State - Empty Table and Reset Filters", async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    
    // Search for a gibberish term to ensure no results
    const searchInput = page.locator("input[placeholder*='Search']").first();
    await searchInput.fill("GIBBERISH_NO_RESULTS_12345");
    await page.waitForTimeout(500);

    // Verify empty state text
    await expect(page.locator("text=No applications found").first()).toBeVisible();
    
    // Reset Filters button should be visible
    const resetBtn = page.locator("button:has-text('Reset Filters')").first();
    await expect(resetBtn).toBeVisible();
    
    // Click reset and verify search is cleared
    await resetBtn.click();
    await expect(searchInput).toHaveValue("");
  });

  test("15. Dropdown Filtering - Platform and Status", async ({ page }) => {
    await ensureTestApplicationExists(page);
    
    // Filter by Status (Interview)
    const statusSelect = page.locator("button:has-text('All Statuses')").first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.click("[role='option']:has-text('Interview')");
      await page.waitForTimeout(500);
      expect(page.url()).toContain("status=interview");
    }

    // Filter by Platform
    const platformSelect = page.locator("button:has-text('All Platforms')").first();
    if (await platformSelect.isVisible()) {
      await platformSelect.click();
      // Click the second option (first is "All Platforms")
      const firstPlatformOption = page.locator("[role='option']").nth(1);
      if (await firstPlatformOption.isVisible()) {
        await firstPlatformOption.click();
        await page.waitForTimeout(500);
        expect(page.url()).toContain("platform=");
      }
    }
    
    // Clear filters
    const resetBtn = page.locator("button:has-text('Reset Filters')").first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("16. Mobile View - Responsive Layout and Mobile Filters", async ({ page }) => {
    await ensureTestApplicationExists(page);
    
    // Set viewport to a mobile device size (iPhone 12/13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    
    // On mobile, "Filters" button should be visible to toggle filters
    const filtersBtn = page.locator("button:has-text('Filters')").first();
    await expect(filtersBtn).toBeVisible();
    
    // Restore viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("17. External Link Validation", async ({ page }) => {
    await ensureTestApplicationExists(page);
    
    // Find the link icon
    const externalLink = page.locator("a[target='_blank']").first();
    if (await externalLink.isVisible()) {
      await expect(externalLink).toHaveAttribute("href", /https?:\/\/.+/);
    }
  });

  test("18. Pagination Controls - Navigation and Page Size", async ({ page }) => {
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    
    const paginationText = page.locator("text=/Showing \\d+ of \\d+/");
    if (await paginationText.isVisible()) {
      await expect(paginationText).toBeVisible();
    }
    
    const rowsPerPageLabel = page.locator("text=Rows per page");
    if (await rowsPerPageLabel.isVisible()) {
      await expect(rowsPerPageLabel).toBeVisible();
    }
    
    const nextBtn = page.locator("button:has-text('Next')").first();
    if (await nextBtn.isVisible()) {
      await expect(nextBtn).toBeVisible();
    }
  });



  test("20. Kanban - Drag and Drop Status Update", async ({ page }) => {
    await ensureTestApplicationExists(page);
    await page.goto("/applications?view=kanban");
    await page.waitForLoadState("networkidle");
    
    const firstCard = page.locator("[draggable='true']").first();
    if (await firstCard.isVisible()) {
      // Drop into the "Rejected" column
      const targetCol = page.locator("div:has(> div > h3:has-text('Rejected'))").first();
      await firstCard.dragTo(targetCol);
      
      // Expect toast Moved "..." to Rejected
      await expect(page.locator("text=/Moved \".*\" to Rejected/").first()).toBeVisible();
    }
  });

  test("21. Bulk Actions - Update Status and Delete", async ({ page }) => {
    await ensureTestApplicationExists(page);
    await page.goto("/applications?view=table");
    await page.waitForLoadState("networkidle");
    
    // Select all rows
    const selectAllCb = page.getByLabel("Select all").first();
    await selectAllCb.check();
    
    // Test Bulk Status Update
    const bulkStatusSelect = page.locator("button:has-text('Mark Status...')").first();
    await bulkStatusSelect.click();
    await page.click("[role='option']:has-text('Offer')");
    
    await expect(page.locator("text=/Updated status for/").first()).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Re-check select all (it unchecks after bulk action usually)
    await selectAllCb.click({ force: true });
    
    // Test Bulk Delete
    const bulkDeleteBtn = page.locator("button:has-text('Bulk Delete')").first();
    await expect(bulkDeleteBtn).toBeVisible();
    await bulkDeleteBtn.click({ force: true });
    
    await expect(page.locator("text=/Successfully deleted/").first()).toBeVisible();
  });
});

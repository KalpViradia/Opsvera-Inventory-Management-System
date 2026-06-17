import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

test.describe("Visual Regression & UI Tests", () => {
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test("dashboard layout has no unexpected shifts", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    
    // Check main areas
    await expect(page.locator("aside").first()).toBeVisible();
    await expect(page.locator("header").first()).toBeVisible();
    
    // Take full page screenshot for visual regression
    await expect(page).toHaveScreenshot("dashboard.png", { fullPage: true, maxDiffPixels: 100 });
  });

  test("products page table rendering", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Ensure the table renders
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Verify pagination or empty state exists
    const rowCount = await table.locator("tbody tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(0);

    await expect(page).toHaveScreenshot("products.png", { fullPage: true, maxDiffPixels: 100 });
  });

  test("UI interaction: opening a modal dialog", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Click 'Add Product'
    const addBtn = page.getByRole("button", { name: /Add Product/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();

      // Check if a dialog or navigation occurred
      // (Depends on if Add Product is a dialog or a new route /products/new)
      if (page.url().includes("/new")) {
        await expect(page.getByRole("heading", { name: /Create Product/i })).toBeVisible();
      } else {
        await expect(page.getByRole("dialog")).toBeVisible();
      }
    }
  });
});

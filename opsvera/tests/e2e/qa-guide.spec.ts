import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

test.describe("QA Guide Checklist Automation", () => {
  // Use the admin storage state saved by auth.setup.ts
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test("Products Catalog: should view list and navigate to create page", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Products/i }).first()).toBeVisible();
    
    // Navigate to Create Product
    await page.getByRole("link", { name: /Add Product/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /New Product/i })).toBeVisible();
    
    // Ensure form is visible
    await expect(page.getByLabel(/Name/i)).toBeVisible();
    await expect(page.getByLabel(/SKU/i)).toBeVisible();
  });

  test("Warehouses: should open the Add Warehouse dialog", async ({ page }) => {
    await page.goto("/warehouses");
    await page.waitForLoadState("networkidle");
    
    // Click Add Warehouse
    await page.getByRole("button", { name: /Add Warehouse/i }).click();
    
    // Check if dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Add New Warehouse/i })).toBeVisible();
    
    // Close dialog
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Inventory: should verify Record Stock entry dropdown fallback", async ({ page }) => {
    await page.goto("/inventory/entries");
    await page.waitForLoadState("networkidle");
    
    // Click Record Stock Movement
    await page.getByRole("button", { name: /Record Stock Movement/i }).click();
    
    // We expect the dialog to open
    await expect(page.getByRole("dialog")).toBeVisible();
    
    // Check the destination dropdown
    await page.getByLabel("Destination").click();
    
    // Wait for popover
    // Either it shows a disabled "No locations available" or actual locations.
    const emptyState = page.getByRole("option", { name: /No locations available/i, disabled: true });
    const locationOption = page.getByRole("option").first(); // If there are locations
    
    await expect(emptyState.or(locationOption)).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("Manufacturing: should check BOM form empty dropdowns", async ({ page }) => {
    await page.goto("/manufacturing/boms");
    await page.waitForLoadState("networkidle");
    
    await page.getByRole("button", { name: /Create BOM/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    
    // Click Finished Good
    const finishedGoodLabel = page.locator('label', { hasText: 'Finished Good' });
    // Find the select trigger adjacent to it
    await finishedGoodLabel.locator('..').locator('button[role="combobox"]').click();
    
    const emptyProducts = page.getByRole("option", { name: /No products available/i, disabled: true });
    const productOption = page.getByRole("option").first();
    await expect(emptyProducts.or(productOption)).toBeVisible();
    
    await page.keyboard.press("Escape");
    // wait for select to close
    
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Manufacturing: should check Production Order BOM dropdown", async ({ page }) => {
    await page.goto("/manufacturing/production");
    await page.waitForLoadState("networkidle");
    
    await page.getByRole("button", { name: /New Production Order/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    
    await page.locator('label', { hasText: 'Bill of Materials' }).locator('..').locator('button[role="combobox"]').click();
    
    const emptyBOMs = page.getByRole("option", { name: /No Bill of Materials available/i, disabled: true });
    const bomOption = page.getByRole("option").first();
    await expect(emptyBOMs.or(bomOption)).toBeVisible();
  });

  test("Sales: should show toast when clicking Create Price List", async ({ page }) => {
    await page.goto("/sales/price-lists");
    await page.waitForLoadState("networkidle");
    
    await page.getByRole("button", { name: /Create Price List/i }).click();
    
    // Toast should appear
    await expect(page.getByText(/Price List creation is under development/i)).toBeVisible();
  });
});

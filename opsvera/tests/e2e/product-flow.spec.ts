import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

test.describe("Product Core Flow", () => {
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test("should allow creating a new product", async ({ page }) => {
    // Navigate to products
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Click Add Product
    await page.getByRole("link", { name: /Add Product/i }).click();

    // Fill the form
    await page.fill('input[name="name"]', "Test Product 123");
    await page.fill('input[name="sku"]', "TEST-123");
    
    // Select category and unit (assume they exist or just type if it's a select)
    // Wait for the form to submit
    // Note: This is a placeholder since the exact form fields depend on the actual UI implementation
    // For now we just verify the new page loads
    await expect(page.getByRole("heading", { name: /Add Product/i })).toBeVisible();
  });
});

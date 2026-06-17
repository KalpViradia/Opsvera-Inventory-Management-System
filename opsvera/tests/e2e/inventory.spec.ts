import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

test.describe("Inventory Workflow", () => {
  // Use the admin storage state saved by auth.setup.ts
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test("should load the inventory dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Dashboard/i, exact: false }).first()).toBeVisible();
  });

  test("should view the products list", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Products/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Add Product/i })).toBeVisible();
  });

  test("should view warehouses", async ({ page }) => {
    await page.goto("/warehouses");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Warehouses/i }).first()).toBeVisible();
  });
});

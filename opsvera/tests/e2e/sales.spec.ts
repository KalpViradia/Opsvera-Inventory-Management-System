import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

test.describe("Sales Workflow", () => {
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test("should load the sales orders dashboard", async ({ page }) => {
    await page.goto("/sales/orders");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Sales Orders/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /New Order/i })).toBeVisible();
  });

  test("should load the customers list", async ({ page }) => {
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Customers/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Add Customer/i })).toBeVisible();
  });

  test("should view quotations", async ({ page }) => {
    await page.goto("/sales/quotations");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Quotations/i }).first()).toBeVisible();
  });
});

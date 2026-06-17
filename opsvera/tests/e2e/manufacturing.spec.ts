import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

test.describe("Manufacturing Workflow", () => {
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  test("should load the BOM dashboard", async ({ page }) => {
    await page.goto("/manufacturing/boms");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Bills of Materials/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Create BOM/i })).toBeVisible();
  });

  test("should load Production Orders dashboard", async ({ page }) => {
    await page.goto("/manufacturing/production");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Production Orders/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /New Production Order/i })).toBeVisible();
  });
});

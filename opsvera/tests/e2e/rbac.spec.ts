import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

/**
 * RBAC E2E Tests
 * 
 * These tests validate that navigation visibility and route access
 * are correctly enforced based on the user's role.
 * 
 * The sidebar filtering is driven by `checkPermission()` and `checkMinimumRole()`
 * in src/components/layouts/sidebar.tsx.
 */

const roles = [
  { role: ROLES.OWNER, label: "Owner" },
  { role: ROLES.ADMIN, label: "Admin" },
  { role: ROLES.MANAGER, label: "Manager" },
  { role: ROLES.STAFF, label: "Staff" },
  { role: ROLES.VIEWER, label: "Viewer" },
];

// Items that ALL roles should see (they have read access to these modules)
const universalItems = ["Dashboard", "Products", "Warehouses", "Inventory", "Purchases", "Suppliers", "Sales", "Customers"];

// Items that should be HIDDEN for specific roles
const hiddenFor: Record<string, string[]> = {
  [ROLES.STAFF]: ["Accounting", "General", "Users & Roles", "Custom Fields", "Audit Log"],
  [ROLES.VIEWER]: ["General", "Users & Roles", "Custom Fields"],
  [ROLES.MANAGER]: ["General", "Users & Roles", "Custom Fields", "Audit Log"],
};

for (const { role, label } of roles) {
  test.describe(`RBAC: ${label} role`, () => {
    test.use({ storageState: `playwright/.auth/${role}.json` });

    test("sidebar shows correct navigation items", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Get the sidebar nav element
      const sidebar = page.locator("aside nav");
      await expect(sidebar).toBeVisible({ timeout: 10_000 });

      const sidebarText = await sidebar.innerText();

      // All roles should see the universal items
      for (const item of universalItems) {
        expect(sidebarText, `${label} should see "${item}"`).toContain(item);
      }

      // Check that hidden items are actually hidden
      const hidden = hiddenFor[role] ?? [];
      for (const item of hidden) {
        expect(sidebarText, `${label} should NOT see "${item}"`).not.toContain(item);
      }
    });

    // Only test route protection for non-admin roles
    if (role === ROLES.STAFF || role === ROLES.VIEWER || role === ROLES.MANAGER) {
      test("direct navigation to /settings/users should be blocked", async ({ page }) => {
        const response = await page.goto("/settings/users");
        await page.waitForLoadState("networkidle");

        const bodyText = await page.innerText("body");
        const url = page.url();

        // Should either redirect to dashboard, show 403/unauthorized, or show an error
        const isBlocked =
          url.includes("/dashboard") ||
          url.includes("/login") ||
          bodyText.toLowerCase().includes("unauthorized") ||
          bodyText.toLowerCase().includes("access denied") ||
          bodyText.toLowerCase().includes("permission") ||
          (response?.status() === 403);

        expect(isBlocked, `${label} should be blocked from /settings/users`).toBeTruthy();
      });
    }

    // Staff-specific: /accounting should be blocked
    if (role === ROLES.STAFF) {
      test("direct navigation to /accounting should be blocked", async ({ page }) => {
        const response = await page.goto("/accounting");
        await page.waitForLoadState("networkidle");

        const bodyText = await page.innerText("body");
        const url = page.url();

        const isBlocked =
          url.includes("/dashboard") ||
          bodyText.toLowerCase().includes("unauthorized") ||
          bodyText.toLowerCase().includes("access denied") ||
          bodyText.toLowerCase().includes("permission") ||
          (response?.status() === 403);

        expect(isBlocked, `Staff should be blocked from /accounting`).toBeTruthy();
      });
    }
  });
}

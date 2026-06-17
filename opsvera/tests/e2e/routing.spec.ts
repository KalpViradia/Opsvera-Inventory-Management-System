import { test, expect } from "@playwright/test";
import { ROLES } from "../../src/constants/roles";

const ROUTES = [
  "/dashboard",
  "/products",
  "/inventory",
  "/purchases",
  "/suppliers",
  "/sales",
  "/customers",
  "/accounting",
  "/reports",
  "/settings/general",
  "/settings/users",
  "/settings/custom-fields",
  "/settings/audit",
];

test.describe("Route Audit & Console Error Tests", () => {
  // Use admin role so they can access all routes
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  for (const route of ROUTES) {
    test(`Route ${route} should load without console errors or hydration warnings`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];

      // Trap console logs
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
        if (msg.type() === "warning" && msg.text().includes("Warning: Text content did not match")) {
          // Specifically trap React Hydration warnings
          consoleWarnings.push(msg.text());
        }
      });

      // Navigate to route
      const response = await page.goto(route);
      
      // Ensure we didn't get a 404 or 500
      expect(response?.status()).toBe(200);

      // Wait for network idle to ensure all client-side JS ran
      await page.waitForLoadState("networkidle");

      // Assert no errors occurred
      expect(consoleErrors, `Console errors found on ${route}`).toEqual([]);
      expect(consoleWarnings, `Hydration warnings found on ${route}`).toEqual([]);
    });
  }
});

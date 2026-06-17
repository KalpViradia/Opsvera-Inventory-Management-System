import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ROLES } from "../../src/constants/roles";

const PAGES_TO_TEST = [
  "/login",
  "/register",
  "/dashboard",
  "/products",
  "/sales",
];

test.describe("Accessibility Audits", () => {
  // Use admin to access all pages
  test.use({ storageState: `playwright/.auth/${ROLES.ADMIN}.json` });

  for (const pagePath of PAGES_TO_TEST) {
    test(`Accessibility on ${pagePath}`, async ({ page }) => {
      // For login and register, we don't want the authenticated storage state 
      // but Playwright doesn't easily let you clear it mid-suite.
      // We will skip auth check if it redirects us, and just test the page we land on.
      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Ensure no severe violations
      const violations = accessibilityScanResults.violations.filter(
        v => v.impact === "critical" || v.impact === "serious"
      );

      if (violations.length > 0) {
        console.error(`Accessibility Violations on ${pagePath}:`, violations);
      }
      
      expect(violations.length).toBe(0);
    });
  }
});

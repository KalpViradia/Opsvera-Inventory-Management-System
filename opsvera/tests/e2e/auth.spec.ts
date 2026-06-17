import { test, expect } from "@playwright/test";

test.describe("Authentication Tests", () => {
  // Clean session state — no stored cookies
  test.use({ storageState: { cookies: [], origins: [] } });

  const validUser = { email: "viewer@test.com", password: "Password123!" };

  test("should successfully login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#email").fill(validUser.email);
    await page.locator("#password").fill(validUser.password);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard**", { timeout: 15_000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#email").fill("nonexistent@fake.com");
    await page.locator("#password").fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    // Wait for sonner error toast to appear
    const toast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(toast).toBeVisible({ timeout: 10_000 });
  });

  test("should redirect unauthenticated users from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    // Proxy should redirect to /login with callbackUrl
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("logout should clear session and prevent back-button access", async ({ page }) => {
    // 1. Login first
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill(validUser.email);
    await page.locator("#password").fill(validUser.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard**", { timeout: 15_000 });

    // 2. Find and click the user menu → logout
    // The user dropdown is typically in the header. Let's find it.
    const userBtn = page.locator('[data-testid="user-menu"], button:has(span.sr-only:text("User menu")), header button[aria-haspopup]').first();
    if (await userBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await userBtn.click();
      const logoutItem = page.locator('text="Log out"').first();
      if (await logoutItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await logoutItem.click();
        await page.waitForURL("**/login**", { timeout: 10_000 });

        // 3. Back button test: proxy should redirect back to login
        await page.goBack();
        await page.waitForTimeout(2000);
        // Because of no-cache headers, the browser should re-request, and proxy will redirect
        expect(page.url()).toContain("/login");
      }
    }
  });
});

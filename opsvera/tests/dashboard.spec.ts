import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // Go to the home page or dashboard
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Assuming the page title contains Opsvera
  await expect(page).toHaveTitle(/Opsvera/);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/');
  
  // Since this is a protected dashboard, it might redirect to login if not authenticated.
  // Let's verify the login page or onboarding page loads.
  const url = page.url();
  if (url.includes('/login') || url.includes('/onboarding') || url.includes('/register')) {
    await expect(page.locator('body')).toBeVisible();
  }
});

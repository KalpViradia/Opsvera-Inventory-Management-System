import { test as setup } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { ROLES, ROLE_PERMISSION_MATRIX, ROLE_LEVELS, ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../src/constants/roles";

const TEST_PASSWORD = "Password123!";

const usersToCreate = [
  { email: "owner@test.com", role: ROLES.OWNER, name: "Test Owner" },
  { email: "admin@test.com", role: ROLES.ADMIN, name: "Test Admin" },
  { email: "manager@test.com", role: ROLES.MANAGER, name: "Test Manager" },
  { email: "staff@test.com", role: ROLES.STAFF, name: "Test Staff" },
  { email: "viewer@test.com", role: ROLES.VIEWER, name: "Test Viewer" },
];

// Step 1: Register or login each user and save their storage state
for (const user of usersToCreate) {
  setup(`authenticate as ${user.role}`, async ({ page }) => {
    setup.setTimeout(300_000); // 300s timeout per user

    // First, try to register the user
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Fill the registration form
    await page.locator("#name").fill(user.name);
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(TEST_PASSWORD);

    // Click the "Create account" submit button
    await page.locator('button[type="submit"]').click();

    // Wait: either we land on /onboarding/company (new user) or we see an error toast (existing user)
    const result = await Promise.race([
      page.waitForURL("**/onboarding/**", { timeout: 120_000 }).then(() => "registered" as const),
      page.waitForURL("**/dashboard**", { timeout: 120_000 }).then(() => "dashboard" as const),
      page.locator('[data-sonner-toast][data-type="error"]').waitFor({ timeout: 120_000 }).then(() => "error" as const),
    ]).catch(() => "timeout" as const);

    if (result === "error" || result === "timeout") {
      // User likely already exists — login instead
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      await page.locator("#email").fill(user.email);
      await page.locator("#password").fill(TEST_PASSWORD);
      await page.locator('button[type="submit"]').click();

      // Wait for dashboard or onboarding redirect
      await page.waitForURL(/.*(\/dashboard|\/onboarding).*/, { timeout: 120_000 });
    }

    // Save storage state (session cookie) for this role
    await page.context().storageState({ path: `playwright/.auth/${user.role}.json` });
  });
}

// Step 2: After all users are authenticated, group them into a single company
setup("seed test company and assign roles", async () => {
  setup.setTimeout(30_000);

  const prisma = new PrismaClient();

  try {
    // Create or upsert a shared test company
    const company = await prisma.company.upsert({
      where: { slug: "e2e-test-inc" },
      update: {},
      create: {
        name: "E2E Test Inc",
        slug: "e2e-test-inc",
        currency: "USD",
        timezone: "UTC",
        onboardingCompleted: true,
      },
    });

    // For each test user: assign them to the company with the correct role,
    // and ensure the RBAC role + permissions exist
    for (const user of usersToCreate) {
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (dbUser) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { companyId: company.id, role: user.role },
        });
      }

      // Upsert the Role entity
      const role = await prisma.role.upsert({
        where: { companyId_name: { companyId: company.id, name: user.role } },
        update: {},
        create: {
          name: user.role,
          label: ROLE_LABELS[user.role],
          description: ROLE_DESCRIPTIONS[user.role],
          level: ROLE_LEVELS[user.role],
          companyId: company.id,
          isSystem: true,
        },
      });

      // Upsert RolePermission records from the static matrix
      const matrix = ROLE_PERMISSION_MATRIX[user.role];
      if (matrix) {
        for (const [module, perms] of Object.entries(matrix)) {
          await prisma.rolePermission.upsert({
            where: { roleId_module: { roleId: role.id, module } },
            update: {
              canRead: perms.read,
              canWrite: perms.write,
              canDelete: perms.delete,
              canApprove: perms.approve,
            },
            create: {
              roleId: role.id,
              companyId: company.id,
              module,
              canRead: perms.read,
              canWrite: perms.write,
              canDelete: perms.delete,
              canApprove: perms.approve,
            },
          });
        }
      }
    }

    console.log("✅ Test company and roles seeded successfully");
  } finally {
    await prisma.$disconnect();
  }
});

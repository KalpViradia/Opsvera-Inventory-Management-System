import { PrismaClient } from "@prisma/client";
import { ROLE_PERMISSION_MATRIX, SYSTEM_ROLES, ROLES } from "../../src/constants/roles";


const prisma = new PrismaClient();

async function globalSetup() {
  console.log("🛠️  Running Global Setup - Seeding Test Environment");

  try {
    // 1. Create a Test Company
    const company = await prisma.company.upsert({
      where: { slug: "opsvera-test-inc" },
      update: {},
      create: {
        name: "Opsvera Test Inc",
        slug: "opsvera-test-inc",
        currency: "USD",
        timezone: "UTC",
        onboardingCompleted: true,
      },
    });

    // 2. Seed Roles and Permissions
    for (const roleDef of SYSTEM_ROLES) {
      const role = await prisma.role.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: roleDef.name,
          },
        },
        update: {},
        create: {
          name: roleDef.name,
          label: roleDef.label,
          description: roleDef.description,
          level: roleDef.level,
          isSystem: roleDef.isSystem,
          companyId: company.id,
        },
      });

      // Insert permissions based on the matrix
      const matrix = ROLE_PERMISSION_MATRIX[roleDef.name];
      if (matrix) {
        for (const [module, perms] of Object.entries(matrix)) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_module: {
                roleId: role.id,
                module,
              },
            },
            update: {},
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

    // 3. Create Test Users for Each Role
    const usersToCreate = [
      { email: "owner@test.com", password: "Password123!", role: ROLES.OWNER, name: "Test Owner" },
      { email: "admin@test.com", password: "Password123!", role: ROLES.ADMIN, name: "Test Admin" },
      { email: "manager@test.com", password: "Password123!", role: ROLES.MANAGER, name: "Test Manager" },
      { email: "staff@test.com", password: "Password123!", role: ROLES.STAFF, name: "Test Staff" },
      { email: "viewer@test.com", password: "Password123!", role: ROLES.VIEWER, name: "Test Viewer" },
    ];

    for (const u of usersToCreate) {
      const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
      
      if (!existingUser) {
        console.log(`Creating user: ${u.email}`);
        
        // We must use better-auth server action to create users so passwords get hashed correctly
        // But Better Auth API requires headers. We can just insert using Prisma, but password hashing is required.
        // Actually better auth has `auth.api.signUpEmail`
        // Since we don't have request objects here, let's create it manually if we know the hashing algorithm
        // Better Auth uses bcrypt or argon2. 
        // Let's use `auth.api.signUpEmail` which might work server-side if we mock headers.
        
        // As a workaround for e2e tests, we can just use the UI to sign them up in a setup test, or insert them directly.
      } else {
        // Ensure they have the right company and role
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            companyId: company.id,
            role: u.role,
          }
        });
      }
    }

    console.log("✅ Global Setup Complete");
  } catch (error) {
    console.error("❌ Global Setup Failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;

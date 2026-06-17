"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import {
  createCompanySchema,
  preferencesSchema,
  type CreateCompanyInput,
  type PreferencesInput,
} from "@/validations/onboarding";
import { SYSTEM_ROLES, ROLE_PERMISSION_MATRIX } from "@/constants/roles";

/**
 * Generate a URL-safe slug from a company name.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure slug uniqueness by appending a number if needed.
 */
async function uniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ============================================
// Step 1: Create Company
// ============================================

export async function createCompany(data: CreateCompanyInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validated = createCompanySchema.parse(data);

  // Generate unique slug
  const slug = await uniqueSlug(slugify(validated.name));

  // Create company with default roles and permissions in a transaction
  const company = await prisma.$transaction(async (tx) => {
    // 1. Create the company
    const newCompany = await tx.company.create({
      data: {
        name: validated.name,
        slug,
        industry: validated.industry,
      },
    });

    // 2. Create system roles with permissions
    for (const roleData of SYSTEM_ROLES) {
      const role = await tx.role.create({
        data: {
          name: roleData.name,
          label: roleData.label,
          description: roleData.description,
          level: roleData.level,
          isSystem: roleData.isSystem,
          companyId: newCompany.id,
        },
      });

      // Create permissions for this role
      const matrix = ROLE_PERMISSION_MATRIX[roleData.name as keyof typeof ROLE_PERMISSION_MATRIX];
      if (matrix) {
        const permissionData = Object.entries(matrix).map(([module, perms]) => ({
          module,
          canRead: perms.read,
          canWrite: perms.write,
          canDelete: perms.delete,
          canApprove: perms.approve,
          roleId: role.id,
          companyId: newCompany.id,
        }));

        await tx.rolePermission.createMany({
          data: permissionData,
        });
      }
    }

    // 3. Assign the creating user as Owner
    await tx.user.update({
      where: { id: user.id },
      data: {
        companyId: newCompany.id,
        role: "owner",
      },
    });

    return newCompany;
  });

  return { success: true, companyId: company.id };
}

// ============================================
// Step 2: Invite Team Members (stub)
// ============================================

export async function inviteTeamMembers(
  invites: Array<{ email: string; role: string }>
) {
  const user = await getCurrentUser();
  if (!user?.companyId) {
    throw new Error("Unauthorized: No company");
  }

  const { createInvitation } = await import("@/actions/invitations");

  let invitedCount = 0;
  for (const invite of invites) {
    if (!invite.email) continue;
    try {
      await createInvitation({
        email: invite.email,
        role: invite.role || "staff",
      });
      invitedCount++;
    } catch (e) {
      console.error("Failed to invite", invite.email, e);
    }
  }

  return {
    success: true,
    invited: invitedCount,
    message:
      invitedCount > 0
        ? `${invitedCount} invitation(s) queued`
        : "No invitations sent",
  };
}

// ============================================
// Step 3: Set Preferences
// ============================================

export async function setCompanyPreferences(data: PreferencesInput) {
  const user = await getCurrentUser();
  if (!user?.companyId) {
    throw new Error("Unauthorized: No company");
  }

  const validated = preferencesSchema.parse(data);

  await prisma.company.update({
    where: { id: user.companyId },
    data: {
      currency: validated.currency,
      timezone: validated.timezone,
      fiscalYearStart: validated.fiscalYearStart,
      onboardingCompleted: true,
    },
  });

  return { success: true };
}

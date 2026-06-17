"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";


export async function getCompanyRoles() {
  const user = await requireCompany();
  await requirePermission("users:read");

  // Get roles and their permissions for this company
  return prisma.role.findMany({
    where: { companyId: user.companyId },
    include: {
      permissions: true,
    },
    orderBy: { level: "desc" },
  });
}

export async function updateRolePermission(
  roleId: string,
  moduleName: string,
  permissions: { canRead?: boolean; canWrite?: boolean; canDelete?: boolean; canApprove?: boolean }
) {
  const user = await requireCompany();
  await requirePermission("users:write");

  // Ensure role belongs to company
  const role = await prisma.role.findUnique({
    where: { id: roleId, companyId: user.companyId },
  });

  if (!role) throw new Error("Role not found");

  // Prevent modifying owner or admin core permissions
  if (role.name === "owner" || role.name === "admin") {
    // Admin can't have audit permissions reduced, Owner can't have any reduced
    throw new Error(`Cannot modify permissions for the ${role.label} role`);
  }

  // Upsert the permission
  const updatedPerm = await prisma.rolePermission.upsert({
    where: {
      roleId_module: {
        roleId,
        module: moduleName,
      },
    },
    update: permissions,
    create: {
      roleId,
      companyId: user.companyId,
      module: moduleName,
      canRead: permissions.canRead ?? false,
      canWrite: permissions.canWrite ?? false,
      canDelete: permissions.canDelete ?? false,
      canApprove: permissions.canApprove ?? false,
    },
  });

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "UPDATED",
    entityType: "RolePermission",
    entityId: updatedPerm.id,
    details: `Updated ${moduleName} permissions for role ${role.label}`,
  });

  revalidatePath("/settings/users");
  
  return updatedPerm;
}

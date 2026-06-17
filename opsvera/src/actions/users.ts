"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requireMinimumRole } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { updateUserRoleSchema, type UpdateUserRoleInput } from "@/validations/user";
import { revalidatePath } from "next/cache";

export async function updateUserRole(data: UpdateUserRoleInput) {
  const currentUser = await requireMinimumRole("admin");
  const userCompany = await requireCompany();

  const parsed = updateUserRoleSchema.parse(data);

  if (currentUser.id === parsed.userId) {
    throw new Error("You cannot change your own role");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.userId, companyId: userCompany.companyId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.role === "owner") {
    throw new Error("Cannot change the role of the company owner");
  }

  const updatedUser = await prisma.user.update({
    where: { id: parsed.userId },
    data: { role: parsed.role },
  });

  await logActivity({
    userId: currentUser.id,
    companyId: userCompany.companyId,
    action: "UPDATED",
    entityType: "User",
    entityId: updatedUser.id,
    details: `Changed role of user "${updatedUser.name}" to ${parsed.role}`,
  });

  revalidatePath("/settings/users");

  return updatedUser;
}

export async function deactivateUser(userId: string) {
  const currentUser = await requireMinimumRole("admin");
  const userCompany = await requireCompany();

  if (currentUser.id === userId) {
    throw new Error("You cannot deactivate yourself");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId, companyId: userCompany.companyId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.role === "owner") {
    throw new Error("Cannot deactivate the company owner");
  }

  // Soft delete / remove company access by nulling companyId
  // Better auth also has sessions that might need to be invalidated
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { companyId: null, role: null },
  });

  await logActivity({
    userId: currentUser.id,
    companyId: userCompany.companyId,
    action: "DELETED",
    entityType: "User",
    entityId: updatedUser.id,
    details: `Deactivated user "${targetUser.name}" and removed from company`,
  });

  revalidatePath("/settings/users");

  return updatedUser;
}

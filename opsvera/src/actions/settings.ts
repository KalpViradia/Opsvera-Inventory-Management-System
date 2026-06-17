"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { updateSettingsSchema, type UpdateSettingsInput } from "@/validations/settings";
import { revalidatePath } from "next/cache";

export async function updateCompanySettings(data: UpdateSettingsInput) {
  const user = await requireCompany();
  // Assuming "settings:write" permission exists or just fallback to admin role check
  // Better Auth config has roles, RBAC checks it.
  await requirePermission("settings:write");

  const parsed = updateSettingsSchema.parse(data);

  const updatedCompany = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: parsed.name,
      industry: parsed.industry,
      currency: parsed.currency,
      timezone: parsed.timezone,
      fiscalYearStart: parsed.fiscalYearStart,
    },
  });

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "UPDATED",
    entityType: "Company",
    entityId: user.companyId,
    details: "Updated company settings",
  });

  revalidatePath("/settings/general");
  revalidatePath("/dashboard"); // Sidebar or topbar might need name update

  return updatedCompany;
}

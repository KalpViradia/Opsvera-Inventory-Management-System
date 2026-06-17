"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function getApiKeys() {
  const session = await requirePermission("settings:read");
  const keys = await prisma.apiKey.findMany({
    where: { companyId: session.companyId! },
    orderBy: { createdAt: "desc" },
  });
  return keys;
}

export async function generateApiKey(data: { name: string; scopes: string[]; expiresAt?: Date }) {
  const session = await requirePermission("settings:write");

  // Generate a secure API key prefix + random string
  const prefix = "ops_";
  const randomStr = crypto.randomBytes(32).toString("base64url");
  const key = `${prefix}${randomStr}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      companyId: session.companyId!,
      name: data.name,
      scopes: data.scopes.length > 0 ? data.scopes : ["read"],
      key,
      expiresAt: data.expiresAt,
    },
  });

  revalidatePath("/settings/api-keys");
  
  // Return the actual key ONCE. It won't be visible again.
  return { success: true, apiKey, key };
}

export async function revokeApiKey(id: string) {
  const session = await requirePermission("settings:write");

  await prisma.apiKey.update({
    where: { id, companyId: session.companyId! },
    data: { isActive: false },
  });

  revalidatePath("/settings/api-keys");
  return { success: true };
}

export async function deleteApiKey(id: string) {
  const session = await requirePermission("settings:write");

  await prisma.apiKey.delete({
    where: { id, companyId: session.companyId! },
  });

  revalidatePath("/settings/api-keys");
  return { success: true };
}

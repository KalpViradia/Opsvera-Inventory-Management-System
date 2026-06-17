"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function getWebhooks() {
  const session = await requirePermission("settings:read");
  const webhooks = await prisma.webhook.findMany({
    where: { companyId: session.companyId! },
    orderBy: { createdAt: "desc" },
  });
  return webhooks;
}

export async function createWebhook(data: { url: string; events: string[] }) {
  const session = await requirePermission("settings:write");

  // Generate a cryptographically secure random secret
  const secret = crypto.randomBytes(32).toString("hex");

  const webhook = await prisma.webhook.create({
    data: {
      companyId: session.companyId!,
      url: data.url,
      events: data.events,
      secret,
    },
  });

  revalidatePath("/settings/webhooks");
  return { success: true, webhook };
}

export async function deleteWebhook(id: string) {
  const session = await requirePermission("settings:write");

  await prisma.webhook.delete({
    where: {
      id,
      companyId: session.companyId!,
    },
  });

  revalidatePath("/settings/webhooks");
  return { success: true };
}

export async function getWebhookLogs(webhookId: string) {
  const session = await requirePermission("settings:read");
  
  // Ensure the webhook belongs to the company
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId, companyId: session.companyId! },
  });
  
  if (!webhook) throw new Error("Webhook not found");

  const logs = await prisma.webhookLog.findMany({
    where: { webhookId },
    orderBy: { deliveredAt: "desc" },
    take: 50,
  });

  return logs;
}

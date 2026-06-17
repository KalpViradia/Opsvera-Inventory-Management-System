"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function getBatches() {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const batches = await prisma.batch.findMany({
    where: { companyId: user.companyId },
    include: {
      product: true,
    },
    orderBy: { expiresAt: "asc" },
  });

  return batches;
}

export async function createBatch(data: {
  productId: string;
  batchNumber: string;
  manufacturedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  quantity?: number;
}) {
  const user = await requireCompany();
  await requirePermission("inventory:write");

  const existing = await prisma.batch.findUnique({
    where: {
      companyId_productId_batchNumber: {
        companyId: user.companyId,
        productId: data.productId,
        batchNumber: data.batchNumber,
      },
    },
  });

  if (existing) {
    throw new Error(`Batch number ${data.batchNumber} already exists for this product.`);
  }

  const batch = await prisma.batch.create({
    data: {
      ...data,
      companyId: user.companyId,
    },
  });

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "Batch",
    entityId: batch.id,
    details: `Created batch ${batch.batchNumber}`,
  });

  return batch;
}

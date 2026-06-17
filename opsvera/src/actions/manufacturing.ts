"use server";

import prisma from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { ProductionStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { createStockEntry } from "@/actions/inventory";

// ==========================================
// BOM Actions
// ==========================================

export async function getBOMs() {
  const session = await requireCompany();
  // Assume inventory:read applies to BOMs as well
  await requirePermission("inventory:read");
  
  return prisma.bOM.findMany({
    where: { companyId: session.companyId! },
    include: {
      product: true,
      _count: {
        select: { items: true, productionOrders: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBOMById(id: string) {
  const session = await requireCompany();
  await requirePermission("inventory:read");
  
  return prisma.bOM.findUnique({
    where: { id, companyId: session.companyId! },
    include: {
      product: true,
      items: {
        include: { product: true }
      }
    }
  });
}

export async function createBOM(data: {
  productId: string;
  name: string;
  version?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}) {
  const session = await requireCompany();
  await requirePermission("inventory:write");

  const bom = await prisma.bOM.create({
    data: {
      companyId: session.companyId!,
      productId: data.productId,
      name: data.name,
      version: data.version || "1.0",
      notes: data.notes,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      }
    }
  });

  await logActivity({
    userId: session.id,
    companyId: session.companyId!,
    action: "CREATED",
    entityType: "Product", // Closest match, could add BOM to EntityType in future
    entityId: data.productId,
    details: `Created BOM ${data.name} (v${data.version || "1.0"})`
  });

  revalidatePath("/manufacturing/boms");
  return bom;
}

// ==========================================
// Production Order Actions
// ==========================================

export async function getProductionOrders() {
  const session = await requireCompany();
  await requirePermission("inventory:read");

  return prisma.productionOrder.findMany({
    where: { companyId: session.companyId! },
    include: {
      bom: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProductionOrder(data: {
  bomId: string;
  quantityToProduce: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}) {
  const session = await requireCompany();
  await requirePermission("inventory:write");

  const bom = await prisma.bOM.findUnique({
    where: { id: data.bomId, companyId: session.companyId! }
  });

  if (!bom) throw new Error("BOM not found");

  // Generate order number
  const prefix = "PROD-";
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `${prefix}${dateStr}-${randomNum}`;

  const order = await prisma.productionOrder.create({
    data: {
      companyId: session.companyId!,
      bomId: data.bomId,
      orderNumber,
      quantityToProduce: data.quantityToProduce,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
      createdBy: session.id,
      status: "PLANNED"
    }
  });

  await logActivity({
    userId: session.id,
    companyId: session.companyId!,
    action: "CREATED",
    entityType: "Product", // Reuse Product entityType
    entityId: bom.productId,
    details: `Created Production Order ${orderNumber} for ${data.quantityToProduce} units`
  });

  revalidatePath("/manufacturing/production");
  return order;
}

export async function updateProductionOrderStatus(orderId: string, status: ProductionStatus) {
  const session = await requireCompany();
  await requirePermission("inventory:write");

  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId, companyId: session.companyId! },
    include: {
      bom: {
        include: { items: true }
      }
    }
  });

  if (!order) throw new Error("Production Order not found");

  // If completing, we must deduct raw materials and add finished goods
  if (status === "COMPLETED" && order.status !== "COMPLETED") {
    // We need a default location (e.g. main warehouse) for this simple implementation.
    // In a full MRP system, you'd specify consumption/receipt locations per order.
    const location = await prisma.location.findFirst({
      where: { companyId: session.companyId!, isActive: true }
    });

    if (!location) throw new Error("No active warehouse location found for inventory adjustments.");

    // 1. Consume raw materials
    for (const item of order.bom.items) {
      const totalToConsume = Number(item.quantity) * order.quantityToProduce;
      await createStockEntry({
        productId: item.productId,
        type: "DELIVERY",
        quantity: totalToConsume,
        fromLocationId: location.id,
        notes: `Consumed for Production Order ${order.orderNumber}`,
      });
    }

    // 2. Receive finished good
    await createStockEntry({
      productId: order.bom.productId,
      type: "RECEIPT",
      quantity: order.quantityToProduce,
      toLocationId: location.id,
      notes: `Produced from Production Order ${order.orderNumber}`,
    });
  }

  const updatedOrder = await prisma.productionOrder.update({
    where: { id: orderId },
    data: { status }
  });

  await logActivity({
    userId: session.id,
    companyId: session.companyId!,
    action: "UPDATED",
    entityType: "Product",
    entityId: order.bom.productId,
    details: `Updated Production Order ${order.orderNumber} to ${status}`
  });

  revalidatePath("/manufacturing/production");
  return updatedOrder;
}

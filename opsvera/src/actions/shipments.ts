"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { ShipmentStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { createStockEntry } from "@/actions/inventory";

// Fetch all shipments
export async function getShipments() {
  const session = await requirePermission("sales:read");
  return prisma.shipment.findMany({
    where: { companyId: session.companyId! },
    include: {
      salesOrder: {
        include: {
          customer: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Generate a shipment from a confirmed sales order
export async function createShipmentFromSO(salesOrderId: string) {
  const session = await requirePermission("sales:write");

  const so = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId, companyId: session.companyId! },
    include: { items: true, shipments: true },
  });

  if (!so) throw new Error("Sales order not found");
  if (so.status === "DRAFT" || so.status === "CANCELLED") {
    throw new Error("Cannot ship a draft or cancelled order");
  }

  // Basic check to see if we already have a shipment for this SO (simplistic implementation)
  if (so.shipments.length > 0) {
    throw new Error("A shipment already exists for this order.");
  }

  // Generate shipment number
  const prefix = "SHP-";
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const shipmentNumber = `${prefix}${dateStr}-${randomNum}`;

  const shipment = await prisma.shipment.create({
    data: {
      companyId: session.companyId!,
      salesOrderId: so.id,
      shipmentNumber,
      status: "PENDING",
      items: {
        create: so.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
  });

  await logActivity({
    userId: session.id,
    companyId: session.companyId!,
    action: "CREATED",
    entityType: "SalesOrder",
    entityId: so.id,
    details: `Generated ${shipmentNumber} for SO ${so.soNumber}`
  });
  revalidatePath("/sales/shipments");
  revalidatePath(`/sales/${so.id}`);

  return shipment;
}

// Update shipment status (and process stock deduction if SHIPPED)
export async function updateShipmentStatus(shipmentId: string, status: ShipmentStatus) {
  const session = await requirePermission("sales:write");

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, companyId: session.companyId! },
    include: { items: true, salesOrder: true },
  });

  if (!shipment) throw new Error("Shipment not found");

  // If moving to SHIPPED from a non-shipped status, decrement stock
  if (status === "SHIPPED" && shipment.status !== "SHIPPED") {
    // Need a default location to pull stock from. 
    // In a real system, the user selects the location during picking.
    // For this implementation, we pick the first primary warehouse location.
    const location = await prisma.location.findFirst({
      where: { companyId: session.companyId! },
    });

    if (!location) throw new Error("No warehouse location found to deduct stock from");

    for (const item of shipment.items) {
      await createStockEntry({
        productId: item.productId,
        type: "DELIVERY",
        quantity: item.quantity,
        fromLocationId: location.id,
        notes: `Fulfilled via Shipment ${shipment.shipmentNumber}`,
      });
    }

    // Also update SO status to SHIPPED
    await prisma.salesOrder.update({
      where: { id: shipment.salesOrderId },
      data: { status: "SHIPPED" },
    });
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id: shipmentId },
    data: { 
      status,
      shippedAt: status === "SHIPPED" ? new Date() : undefined,
      deliveredAt: status === "DELIVERED" ? new Date() : undefined,
    },
  });

  await logActivity({
    userId: session.id,
    companyId: session.companyId!,
    action: "UPDATED",
    entityType: "SalesOrder",
    entityId: shipment.salesOrderId,
    details: `Changed ${shipment.shipmentNumber} status to ${status}`
  });
  revalidatePath("/sales/shipments");
  revalidatePath(`/sales/${shipment.salesOrderId}`);

  return updatedShipment;
}

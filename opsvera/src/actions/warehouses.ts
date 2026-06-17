"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { 
  CreateWarehouseInput, 
  UpdateWarehouseInput, 
  createWarehouseSchema, 
  updateWarehouseSchema 
} from "@/validations/warehouse";
import { revalidatePath } from "next/cache";

/**
 * Get all warehouses for the current company
 */
export async function getWarehouses() {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const warehouses = await prisma.warehouse.findMany({
    where: {
      companyId: user.companyId!,
    },
    include: {
      _count: {
        select: { locations: true }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { data: warehouses };
}

/**
 * Get a single warehouse by ID
 */
export async function getWarehouseById(id: string) {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
      companyId: user.companyId!,
    },
    include: {
      locations: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  return { data: warehouse };
}

/**
 * Create a new warehouse
 */
export async function createWarehouse(data: CreateWarehouseInput) {
  const user = await requireCompany();
  await requirePermission("inventory:write");

  const parsed = createWarehouseSchema.parse(data);

  // Check name uniqueness
  const existing = await prisma.warehouse.findUnique({
    where: {
      companyId_name: {
        companyId: user.companyId!,
        name: parsed.name,
      },
    },
  });

  if (existing) {
    throw new Error(`Warehouse with name "${parsed.name}" already exists`);
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: user.companyId!,
      ...parsed,
    },
  });

  revalidatePath("/warehouses");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "Warehouse",
    entityId: warehouse.id,
    details: `Created warehouse "${parsed.name}"`,
  });

  return { data: warehouse };
}

/**
 * Update an existing warehouse
 */
export async function updateWarehouse(id: string, data: UpdateWarehouseInput) {
  const user = await requireCompany();
  await requirePermission("inventory:write");

  const parsed = updateWarehouseSchema.parse(data);

  // Check if warehouse exists and belongs to company
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
      companyId: user.companyId!,
    },
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  // Check name uniqueness if name is changed
  if (parsed.name && parsed.name !== warehouse.name) {
    const existing = await prisma.warehouse.findUnique({
      where: {
        companyId_name: {
          companyId: user.companyId!,
          name: parsed.name,
        },
      },
    });

    if (existing) {
      throw new Error(`Warehouse with name "${parsed.name}" already exists`);
    }
  }

  const updated = await prisma.warehouse.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/warehouses");
  revalidatePath(`/warehouses/${id}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "UPDATED",
    entityType: "Warehouse",
    entityId: id,
    details: `Updated warehouse "${updated.name}"`,
  });

  return { data: updated };
}

/**
 * Delete a warehouse (Soft delete or check if empty first)
 */
export async function deleteWarehouse(id: string) {
  const user = await requireCompany();
  await requirePermission("inventory:delete");

  // Check if warehouse has stock (skip for now since we haven't implemented stock yet, but we will prevent deletion if locations exist)
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
      companyId: user.companyId!,
    },
    include: {
      _count: {
        select: { locations: true }
      }
    }
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  if (warehouse._count.locations > 0) {
    throw new Error("Cannot delete warehouse with existing locations. Delete locations first.");
  }

  await prisma.warehouse.delete({
    where: { id },
  });

  revalidatePath("/warehouses");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "DELETED",
    entityType: "Warehouse",
    entityId: id,
    details: `Deleted warehouse "${warehouse.name}"`,
  });

  return { success: true };
}

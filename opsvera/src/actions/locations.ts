"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { 
  CreateLocationInput, 
  UpdateLocationInput, 
  createLocationSchema, 
  updateLocationSchema 
} from "@/validations/warehouse";
import { revalidatePath } from "next/cache";

/**
 * Get all locations for a warehouse
 */
export async function getWarehouseLocations(warehouseId: string) {
  const user = await requireCompany();
  await requirePermission("inventory:read");

  const locations = await prisma.location.findMany({
    where: {
      warehouseId,
      companyId: user.companyId!,
    },
    orderBy: {
      name: "asc",
    },
  });

  return { data: locations };
}

/**
 * Create a new location
 */
export async function createLocation(data: CreateLocationInput) {
  const user = await requireCompany();
  await requirePermission("inventory:write");

  const parsed = createLocationSchema.parse(data);

  // Check if warehouse belongs to company
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id: parsed.warehouseId,
      companyId: user.companyId!,
    },
  });

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  // Check name uniqueness within parent
  const existing = await prisma.location.findFirst({
    where: {
      warehouseId: parsed.warehouseId,
      name: parsed.name,
      parentLocationId: parsed.parentLocationId || null,
    },
  });

  if (existing) {
    throw new Error(`Location with name "${parsed.name}" already exists at this level`);
  }

  const location = await prisma.location.create({
    data: {
      companyId: user.companyId!,
      ...parsed,
    },
  });

  revalidatePath(`/warehouses/${parsed.warehouseId}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "Location",
    entityId: location.id,
    details: `Created location "${parsed.name}" in warehouse`,
  });

  return { data: location };
}

/**
 * Update a location
 */
export async function updateLocation(id: string, data: UpdateLocationInput) {
  const user = await requireCompany();
  await requirePermission("inventory:write");

  const parsed = updateLocationSchema.parse(data);

  const location = await prisma.location.findUnique({
    where: {
      id,
      companyId: user.companyId!,
    },
  });

  if (!location) {
    throw new Error("Location not found");
  }

  if (parsed.name && parsed.name !== location.name) {
    const existing = await prisma.location.findFirst({
      where: {
        warehouseId: location.warehouseId,
        name: parsed.name,
        parentLocationId: parsed.parentLocationId !== undefined ? parsed.parentLocationId : location.parentLocationId,
        id: { not: id },
      },
    });

    if (existing) {
      throw new Error(`Location with name "${parsed.name}" already exists at this level`);
    }
  }

  const updated = await prisma.location.update({
    where: { id },
    data: parsed,
  });

  revalidatePath(`/warehouses/${location.warehouseId}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "UPDATED",
    entityType: "Location",
    entityId: id,
    details: `Updated location "${updated.name}"`,
  });

  return { data: updated };
}

/**
 * Delete a location
 */
export async function deleteLocation(id: string) {
  const user = await requireCompany();
  await requirePermission("inventory:delete");

  const location = await prisma.location.findUnique({
    where: {
      id,
      companyId: user.companyId!,
    },
    include: {
      _count: {
        select: {
          children: true,
          stockLevels: true,
          stockEntriesFrom: true,
          stockEntriesTo: true,
        }
      }
    }
  });

  if (!location) {
    throw new Error("Location not found");
  }

  if (location._count.children > 0) {
    throw new Error("Cannot delete location with sub-locations. Delete them first.");
  }

  if (location._count.stockLevels > 0) {
    throw new Error("Cannot delete location with existing stock. Move or remove stock first.");
  }

  await prisma.location.delete({
    where: { id },
  });

  revalidatePath(`/warehouses/${location.warehouseId}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "DELETED",
    entityType: "Location",
    entityId: id,
    details: `Deleted location "${location.name}"`,
  });

  return { success: true };
}

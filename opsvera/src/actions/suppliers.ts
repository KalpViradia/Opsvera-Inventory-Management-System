"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { createSupplierSchema, type CreateSupplierInput } from "@/validations/supplier";

export async function getSuppliers() {
  const user = await requireCompany();
  await requirePermission("suppliers:read");

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { data: suppliers };
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    throw new Error("Failed to fetch suppliers");
  }
}

export async function getSupplierById(id: string) {
  const user = await requireCompany();
  await requirePermission("suppliers:read");

  try {
    const supplier = await prisma.supplier.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const customFieldValues = await prisma.customFieldValue.findMany({
      where: { entityId: id },
      include: { field: true },
    });

    return { data: { ...supplier, customFieldValues } };
  } catch (error) {
    console.error("Failed to fetch supplier:", error);
    throw new Error("Failed to fetch supplier");
  }
}

export async function createSupplier(data: CreateSupplierInput) {
  const user = await requireCompany();
  await requirePermission("suppliers:write");

  const validatedData = createSupplierSchema.parse(data);

  try {
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        companyId: user.companyId,
        name: validatedData.name,
      },
    });

    if (existingSupplier) {
      throw new Error("A supplier with this name already exists");
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        companyId: user.companyId,
      },
    });

    revalidatePath("/suppliers");
    
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "CREATED",
      entityType: "Supplier",
      entityId: supplier.id,
      details: `Created supplier "${validatedData.name}"`,
    });

    return { data: supplier };
  } catch (error) {
    console.error("Failed to create supplier:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create supplier");
  }
}

export async function updateSupplier(id: string, data: CreateSupplierInput) {
  const user = await requireCompany();
  await requirePermission("suppliers:write");

  const validatedData = createSupplierSchema.parse(data);

  try {
    // Check if supplier exists and belongs to company
    const supplier = await prisma.supplier.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Check for name collisions
    if (validatedData.name !== supplier.name) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          companyId: user.companyId,
          name: validatedData.name,
        },
      });

      if (existingSupplier) {
        throw new Error("A supplier with this name already exists");
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "UPDATED",
      entityType: "Supplier",
      entityId: id,
      details: `Updated supplier "${validatedData.name}"`,
    });

    return { data: updatedSupplier };
  } catch (error) {
    console.error("Failed to update supplier:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update supplier");
  }
}

export async function deleteSupplier(id: string) {
  const user = await requireCompany();
  await requirePermission("suppliers:delete");

  try {
    const supplier = await prisma.supplier.findUnique({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            purchaseInvoices: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Check for related records that would cause FK constraint errors
    if (supplier._count.purchaseOrders > 0) {
      throw new Error("Cannot delete supplier with existing purchase orders. Deactivate instead.");
    }
    if (supplier._count.purchaseInvoices > 0) {
      throw new Error("Cannot delete supplier with existing invoices. Deactivate instead.");
    }

    await prisma.supplier.delete({
      where: { id },
    });

    revalidatePath("/suppliers");
    
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "DELETED",
      entityType: "Supplier",
      entityId: id,
      details: `Deleted supplier "${supplier.name}"`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete supplier:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete supplier.");
  }
}

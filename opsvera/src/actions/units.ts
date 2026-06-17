"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { createUnitSchema, type CreateUnitInput } from "@/validations/product";
import { revalidatePath } from "next/cache";

/**
 * Get all product units for the current company.
 */
export async function getUnits() {
  const user = await requireCompany();
  await requirePermission("products:read");

  let units = await prisma.productUnit.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  if (units.length === 0) {
    const defaultUnit = await prisma.productUnit.create({
      data: {
        name: "Pieces",
        code: "pcs",
        companyId: user.companyId,
      },
    });
    units = [defaultUnit];
  }

  return units;
}

/**
 * Create a new product unit.
 */
export async function createUnit(data: CreateUnitInput) {
  const user = await requireCompany();
  await requirePermission("products:write");

  const parsed = createUnitSchema.parse(data);

  // Check for duplicate code
  const existing = await prisma.productUnit.findFirst({
    where: { code: parsed.code, companyId: user.companyId },
  });

  if (existing) {
    throw new Error(`Unit code '${parsed.code}' already exists`);
  }

  const unit = await prisma.productUnit.create({
    data: {
      name: parsed.name,
      code: parsed.code,
      companyId: user.companyId,
    },
  });

  revalidatePath("/products");
  revalidatePath("/settings/catalog");

  return unit;
}

/**
 * Delete a product unit.
 */
export async function deleteUnit(id: string) {
  const user = await requireCompany();
  await requirePermission("products:delete");

  // Prevent deleting if products are attached
  const productsCount = await prisma.product.count({
    where: { unitId: id, companyId: user.companyId },
  });

  if (productsCount > 0) {
    throw new Error("Cannot delete unit with associated products");
  }

  await prisma.productUnit.delete({
    where: { id, companyId: user.companyId },
  });

  revalidatePath("/products");
  revalidatePath("/settings/catalog");

  return true;
}

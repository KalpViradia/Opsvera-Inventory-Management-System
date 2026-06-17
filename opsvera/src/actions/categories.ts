"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { createCategorySchema, type CreateCategoryInput } from "@/validations/product";
import { revalidatePath } from "next/cache";

/**
 * Get all product categories for the current company.
 */
export async function getCategories() {
  const user = await requireCompany();
  await requirePermission("products:read");

  let categories = await prisma.productCategory.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  if (categories.length === 0) {
    const defaultCategory = await prisma.productCategory.create({
      data: {
        name: "General",
        description: "Default category",
        companyId: user.companyId,
      },
    });
    categories = [defaultCategory];
  }

  return categories;
}

/**
 * Create a new product category.
 */
export async function createCategory(data: CreateCategoryInput) {
  const user = await requireCompany();
  await requirePermission("products:write");

  const parsed = createCategorySchema.parse(data);

  const category = await prisma.productCategory.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      parentId: parsed.parentId,
      companyId: user.companyId,
    },
  });

  revalidatePath("/products");
  revalidatePath("/settings/catalog");

  return category;
}

/**
 * Delete a product category.
 */
export async function deleteCategory(id: string) {
  const user = await requireCompany();
  await requirePermission("products:delete");

  // Prevent deleting if products are attached
  const productsCount = await prisma.product.count({
    where: { categoryId: id, companyId: user.companyId },
  });

  if (productsCount > 0) {
    throw new Error("Cannot delete category with associated products");
  }

  await prisma.productCategory.delete({
    where: { id, companyId: user.companyId },
  });

  revalidatePath("/products");
  revalidatePath("/settings/catalog");

  return true;
}

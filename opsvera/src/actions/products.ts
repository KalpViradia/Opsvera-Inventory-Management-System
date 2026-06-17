"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/validations/product";
import { revalidatePath } from "next/cache";

import { z } from "zod";

/**
 * Get paginated and filtered products.
 */
export async function getProducts(params: z.input<typeof productFilterSchema> = {}) {
  const user = await requireCompany();
  await requirePermission("products:read");

  const parsed = productFilterSchema.parse(params);
  
  const page = parsed.page || 1;
  const limit = parsed.limit || 20;
  const skip = (page - 1) * limit;

  // Build the where clause
  const where: Prisma.ProductWhereInput = {
    companyId: user.companyId,
  };

  if (parsed.status && parsed.status !== "all") {
    where.status = parsed.status;
  }
  if (parsed.categoryId) {
    where.categoryId = parsed.categoryId;
  }
  if (parsed.search) {
    where.OR = [
      { name: { contains: parsed.search, mode: "insensitive" } },
      { sku: { contains: parsed.search, mode: "insensitive" } },
    ];
  }

  // Get total count
  const total = await prisma.product.count({ where });

  // Get products with variants and relations
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      unit: true,
      variants: true,
    },
    orderBy: {
      [parsed.sort || "createdAt"]: parsed.order || "desc",
    },
    skip,
    take: limit,
  });

  return JSON.parse(JSON.stringify({
    data: products,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }));
}

/**
 * Get a single product by ID.
 */
export async function getProduct(id: string) {
  const user = await requireCompany();
  await requirePermission("products:read");

  const product = await prisma.product.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      category: true,
      unit: true,
      variants: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const customFieldValues = await prisma.customFieldValue.findMany({
    where: { entityId: id },
    include: { field: true },
  });

  return JSON.parse(JSON.stringify({ ...product, customFieldValues }));
}

/**
 * Create a new product with variants.
 */
export async function createProduct(data: CreateProductInput) {
  const user = await requireCompany();
  await requirePermission("products:write");

  const parsed = createProductSchema.parse(data);

  // Check for duplicate product SKU
  const existingSku = await prisma.product.findFirst({
    where: { sku: parsed.sku, companyId: user.companyId },
  });

  if (existingSku) {
    throw new Error(`Product SKU '${parsed.sku}' already exists`);
  }

  // Create product and variants in a transaction
  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        sku: parsed.sku,
        name: parsed.name,
        description: parsed.description,
        categoryId: parsed.categoryId,
        unitId: parsed.unitId,
        status: parsed.status || "DRAFT",
        imageUrl: parsed.imageUrl,
        isBatchTracked: parsed.isBatchTracked,
        minStockLevel: parsed.minStockLevel,
        companyId: user.companyId,
      },
    });

    if (parsed.variants && parsed.variants.length > 0) {
      await tx.productVariant.createMany({
        data: parsed.variants.map((v) => ({
          productId: p.id,
          sku: v.sku || `${parsed.sku}-${v.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
          name: v.name,
          price: v.price,
          cost: v.cost || null,
        })),
      });
    }

    return p;
  });

  revalidatePath("/products");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "Product",
    entityId: product.id,
    details: `Created product "${parsed.name}" (SKU: ${parsed.sku})`,
  });

  return product;
}

/**
 * Update an existing product and its variants.
 */
export async function updateProduct(data: UpdateProductInput) {
  const user = await requireCompany();
  await requirePermission("products:write");

  const parsed = updateProductSchema.parse(data);
  const { id, variants, ...productData } = parsed;

  if (!id) throw new Error("Product ID is required for update");

  // Verify ownership
  const existing = await prisma.product.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  const product = await prisma.$transaction(async (tx) => {
    // Update main product
    const p = await tx.product.update({
      where: { id },
      data: productData,
    });

    // If variants are provided, we do a full replacement for simplicity in this version,
    // or update existing ones. We will delete all and recreate for true sync if IDs aren't provided,
    // but better to sync properly. For now, since schema doesn't require variant IDs,
    // we'll delete and recreate.
    if (variants && variants.length > 0) {
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      await tx.productVariant.createMany({
        data: variants.map((v) => ({
          productId: id,
          sku: v.sku || `${existing.sku}-${v.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
          name: v.name,
          price: v.price,
          cost: v.cost || null,
        })),
      });
    }

    return p;
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "UPDATED",
    entityType: "Product",
    entityId: id,
    details: `Updated product "${existing.name}"`,
  });

  return product;
}

/**
 * Delete a product.
 */
export async function deleteProduct(id: string) {
  const user = await requireCompany();
  await requirePermission("products:delete");

  const existing = await prisma.product.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      _count: {
        select: {
          stockLevels: true,
          purchaseOrderItems: true,
          salesOrderItems: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  // Check for related records that would cause FK constraint errors
  if (existing._count.stockLevels > 0) {
    throw new Error("Cannot delete product with existing stock levels. Remove stock first.");
  }
  if (existing._count.purchaseOrderItems > 0) {
    throw new Error("Cannot delete product referenced in purchase orders.");
  }
  if (existing._count.salesOrderItems > 0) {
    throw new Error("Cannot delete product referenced in sales orders.");
  }

  // Transaction to delete variants and product
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({
      where: { productId: id },
    });
    
    await tx.product.delete({
      where: { id },
    });
  });

  revalidatePath("/products");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "DELETED",
    entityType: "Product",
    entityId: id,
    details: `Deleted product "${existing.name}" (SKU: ${existing.sku})`,
  });

  return true;
}

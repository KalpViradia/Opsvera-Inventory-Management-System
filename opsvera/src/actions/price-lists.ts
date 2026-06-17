"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function getPriceLists() {
  const session = await requirePermission("sales:read");
  return prisma.priceList.findMany({
    where: { companyId: session.companyId! },
    include: { _count: { select: { items: true, customers: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPriceList(id: string) {
  const session = await requirePermission("sales:read");
  return prisma.priceList.findUnique({
    where: { id, companyId: session.companyId! },
    include: {
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });
}

export async function createPriceList(data: {
  name: string;
  description?: string;
  currency: string;
  isActive: boolean;
  items: Array<{ productId: string; price: number; minQuantity: number }>;
}) {
  const session = await requirePermission("sales:write");

  const priceList = await prisma.priceList.create({
    data: {
      companyId: session.companyId!,
      name: data.name,
      description: data.description,
      currency: data.currency,
      isActive: data.isActive,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          price: item.price,
          minQuantity: item.minQuantity,
        })),
      },
    },
  });

  revalidatePath("/sales/price-lists");
  return priceList;
}

export async function deletePriceList(id: string) {
  const session = await requirePermission("sales:delete");
  await prisma.priceList.delete({
    where: { id, companyId: session.companyId! },
  });
  revalidatePath("/sales/price-lists");
}

export async function getProductPriceForCustomer(customerId: string, productId: string, quantity: number = 1) {
  const session = await requirePermission("sales:read");

  // Get customer to find their assigned price list
  const customer = await prisma.customer.findUnique({
    where: { id: customerId, companyId: session.companyId! },
    select: { priceListId: true },
  });

  // If no assigned price list, just return the standard product average cost/MSRP
  if (!customer?.priceListId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    return product?.averageCost ? Number(product.averageCost) : 0;
  }

  // Find price list item
  // We need to find the item that matches the product, and has minQuantity <= quantity
  // If there are volume tiers, get the one with the highest minQuantity that is still <= quantity
  const priceItem = await prisma.priceListItem.findFirst({
    where: {
      priceListId: customer.priceListId,
      productId: productId,
      minQuantity: { lte: quantity },
    },
    orderBy: { minQuantity: "desc" }, // Get the best applicable tier
  });

  if (priceItem) {
    return Number(priceItem.price);
  }

  // Fallback to standard price if product isn't explicitly on the price list
  const product = await prisma.product.findUnique({ where: { id: productId } });
  return product?.averageCost ? Number(product.averageCost) : 0;
}

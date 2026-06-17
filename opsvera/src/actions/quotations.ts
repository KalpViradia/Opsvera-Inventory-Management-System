"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { QuotationStatus } from "@prisma/client";

export async function getQuotations(skip = 0, take = 25) {
  const user = await requireCompany();
  await requirePermission("sales:read");

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where: { companyId: user.companyId },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.quotation.count({
      where: { companyId: user.companyId },
    }),
  ]);

  return JSON.parse(JSON.stringify({ data: { quotations, total } }));
}

export async function getQuotationById(id: string) {
  const user = await requireCompany();
  await requirePermission("sales:read");

  const quotation = await prisma.quotation.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!quotation) {
    throw new Error("Quotation not found");
  }

  return JSON.parse(JSON.stringify({ data: quotation }));
}

export async function createQuotation(data: {
  customerId: string;
  currency: string;
  validUntil: Date;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }[];
}) {
  const user = await requireCompany();
  await requirePermission("sales:write");

  const sequence = await prisma.sequence.upsert({
    where: { companyId_type: { companyId: user.companyId, type: "QT" } },
    update: { value: { increment: 1 } },
    create: { companyId: user.companyId, type: "QT", value: 1 },
  });

  const qtNumber = `QT-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${String(sequence.value).padStart(4, "0")}`;

  let totalAmount = 0;
  let taxAmount = 0;
  let totalDiscount = 0;

  const itemsData = data.items.map((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount || 0;
    const itemTax = ((itemTotal - itemDiscount) * (item.taxRate || 0)) / 100;
    const finalTotal = itemTotal - itemDiscount + itemTax;

    totalAmount += finalTotal;
    taxAmount += itemTax;
    totalDiscount += itemDiscount;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: itemDiscount,
      taxRate: item.taxRate || 0,
      total: finalTotal,
    };
  });

  const quotation = await prisma.quotation.create({
    data: {
      companyId: user.companyId,
      customerId: data.customerId,
      qtNumber,
      currency: data.currency,
      validUntil: data.validUntil,
      notes: data.notes,
      status: "DRAFT",
      totalAmount,
      taxAmount,
      discount: totalDiscount,
      createdBy: user.id,
      items: {
        create: itemsData,
      },
    },
  });

  revalidatePath("/sales/quotations");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "Quotation",
    entityId: quotation.id,
    details: `Created quotation ${qtNumber} for ${totalAmount}`,
  });

  return JSON.parse(JSON.stringify({ data: quotation }));
}

export async function updateQuotationStatus(id: string, status: QuotationStatus) {
  const user = await requireCompany();
  await requirePermission("sales:write");

  const quotation = await prisma.quotation.update({
    where: { id, companyId: user.companyId },
    data: { status },
  });

  revalidatePath("/sales/quotations");
  revalidatePath(`/sales/quotations/${id}`);

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "UPDATED",
    entityType: "Quotation",
    entityId: quotation.id,
    details: `Updated quotation ${quotation.qtNumber} status to ${status}`,
  });

  return JSON.parse(JSON.stringify({ data: quotation }));
}

export async function convertQuotationToSO(id: string) {
  const user = await requireCompany();
  await requirePermission("sales:write"); // Need sales write to create SO

  const quotation = await prisma.quotation.findUnique({
    where: { id, companyId: user.companyId },
    include: { items: true },
  });

  if (!quotation) throw new Error("Quotation not found");
  if (quotation.status !== "ACCEPTED") throw new Error("Only ACCEPTED quotations can be converted");

  const sequence = await prisma.sequence.upsert({
    where: { companyId_type: { companyId: user.companyId, type: "SO" } },
    update: { value: { increment: 1 } },
    create: { companyId: user.companyId, type: "SO", value: 1 },
  });

  const soNumber = `SO-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${String(sequence.value).padStart(4, "0")}`;

  const so = await prisma.$transaction(async (tx) => {
    const newSo = await tx.salesOrder.create({
      data: {
        companyId: user.companyId,
        customerId: quotation.customerId,
        soNumber,
        status: "CONFIRMED", // Auto-confirm since customer already accepted quote
        totalAmount: quotation.totalAmount,
        taxAmount: quotation.taxAmount,
        discount: quotation.discount,
        currency: quotation.currency,
        notes: `Converted from Quotation ${quotation.qtNumber}\n\n${quotation.notes || ""}`,
        createdBy: user.id,
        items: {
          create: quotation.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            total: item.total,
          }))
        }
      }
    });

    // Mark quote as closed? Wait, we can keep it as ACCEPTED, but let's just log it.
    
    return newSo;
  });

  revalidatePath("/sales/orders");
  revalidatePath("/sales/quotations");

  await logActivity({
    userId: user.id,
    companyId: user.companyId,
    action: "CREATED",
    entityType: "SalesOrder",
    entityId: so.id,
    details: `Converted Quotation ${quotation.qtNumber} to Sales Order ${soNumber}`,
  });

  return JSON.parse(JSON.stringify({ data: so }));
}

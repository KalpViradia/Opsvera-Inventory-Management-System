"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";

export async function getPurchaseInvoiceForPDF(invoiceId: string) {
  const user = await requireCompany();
  await requirePermission("purchases:read");

  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id: invoiceId, companyId: user.companyId },
    include: {
      supplier: true,
      po: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  return { invoice, company };
}

export async function getSalesInvoiceForPDF(invoiceId: string) {
  const user = await requireCompany();
  await requirePermission("sales:read");

  const invoice = await prisma.salesInvoice.findUnique({
    where: { id: invoiceId, companyId: user.companyId },
    include: {
      customer: true,
      so: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  return { invoice, company };
}

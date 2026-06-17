"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { generateCSV } from "@/lib/csv";

export async function exportProductsCSV(): Promise<string> {
  const user = await requireCompany();
  await requirePermission("products:read");

  const products = await prisma.product.findMany({
    where: { companyId: user.companyId },
    include: {
      category: true,
      unit: true,
      variants: true,
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "SKU",
    "Name",
    "Description",
    "Category",
    "Unit",
    "Status",
    "Min Stock",
    "Variants Count",
    "Created At",
  ];

  const rows = products.map((p) => [
    p.sku,
    p.name,
    p.description || "",
    p.category.name,
    p.unit.name,
    p.status,
    p.minStockLevel,
    p.variants.length,
    p.createdAt.toISOString().split("T")[0],
  ]);

  return generateCSV(headers, rows);
}

export async function exportPurchaseOrdersCSV(): Promise<string> {
  const user = await requireCompany();
  await requirePermission("purchases:read");

  const pos = await prisma.purchaseOrder.findMany({
    where: { companyId: user.companyId },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "PO Number",
    "Supplier",
    "Status",
    "Total Amount",
    "Tax Amount",
    "Notes",
    "Created At",
    "Approved At",
  ];

  const rows = pos.map((po) => [
    po.poNumber,
    po.supplier.name,
    po.status,
    Number(po.totalAmount).toFixed(2),
    Number(po.taxAmount).toFixed(2),
    po.notes || "",
    po.createdAt.toISOString().split("T")[0],
    po.approvedAt ? po.approvedAt.toISOString().split("T")[0] : "",
  ]);

  return generateCSV(headers, rows);
}

export async function exportSalesOrdersCSV(): Promise<string> {
  const user = await requireCompany();
  await requirePermission("sales:read");

  const sos = await prisma.salesOrder.findMany({
    where: { companyId: user.companyId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "SO Number",
    "Customer",
    "Status",
    "Total Amount",
    "Tax Amount",
    "Discount",
    "Notes",
    "Created At",
  ];

  const rows = sos.map((so) => [
    so.soNumber,
    so.customer.name,
    so.status,
    Number(so.totalAmount).toFixed(2),
    Number(so.taxAmount).toFixed(2),
    Number(so.discount).toFixed(2),
    so.notes || "",
    so.createdAt.toISOString().split("T")[0],
  ]);

  return generateCSV(headers, rows);
}

export async function exportCustomersCSV(): Promise<string> {
  const user = await requireCompany();
  await requirePermission("customers:read");

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Name",
    "Email",
    "Phone",
    "Tax ID",
    "Address",
    "Payment Terms",
    "Credit Limit",
    "Created At",
  ];

  const rows = customers.map((c) => [
    c.name,
    c.email || "",
    c.phone || "",
    c.taxId || "",
    c.address || "",
    c.paymentTerms?.toString() || "",
    c.creditLimit ? c.creditLimit.toString() : "",
    c.createdAt.toISOString().split("T")[0],
  ]);

  return generateCSV(headers, rows);
}

export async function exportSuppliersCSV(): Promise<string> {
  const user = await requireCompany();
  await requirePermission("suppliers:read");

  const suppliers = await prisma.supplier.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Name",
    "Email",
    "Phone",
    "Tax ID",
    "Address",
    "Payment Terms",
    "Created At",
  ];

  const rows = suppliers.map((s) => [
    s.name,
    s.email || "",
    s.phone || "",
    s.taxId || "",
    s.address || "",
    s.paymentTerms?.toString() || "",
    s.createdAt.toISOString().split("T")[0],
  ]);

  return generateCSV(headers, rows);
}

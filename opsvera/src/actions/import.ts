"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireCompany } from "@/lib/rbac";
import { parseCSV } from "@/lib/csv";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}

export async function importProductsCSV(csvString: string): Promise<ImportResult> {
  const user = await requireCompany();
  await requirePermission("products:write");

  const { rows } = parseCSV(csvString);
  const result: ImportResult = { imported: 0, errors: [] };

  if (rows.length === 0) {
    result.errors.push({ row: 0, message: "No data found in CSV" });
    return result;
  }

  // Pre-fetch all categories and units to resolve IDs by name
  const [categories, units] = await Promise.all([
    prisma.productCategory.findMany({ where: { companyId: user.companyId } }),
    prisma.productUnit.findMany({ where: { companyId: user.companyId } }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const unitMap = new Map(units.map((u) => [u.name.toLowerCase(), u.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for header row

    try {
      // Required fields check
      if (!row["SKU"] || !row["Name"] || !row["Category"] || !row["Unit"]) {
        result.errors.push({
          row: rowNum,
          message: "Missing required fields (SKU, Name, Category, Unit)",
        });
        continue;
      }

      // Check for duplicate SKU
      const existingSku = await prisma.product.findFirst({
        where: { sku: row["SKU"], companyId: user.companyId },
      });

      if (existingSku) {
        result.errors.push({ row: rowNum, message: `SKU '${row["SKU"]}' already exists` });
        continue;
      }

      // Resolve references
      const categoryId = categoryMap.get(row["Category"].toLowerCase());
      if (!categoryId) {
        result.errors.push({ row: rowNum, message: `Category '${row["Category"]}' not found` });
        continue;
      }

      const unitId = unitMap.get(row["Unit"].toLowerCase());
      if (!unitId) {
        result.errors.push({ row: rowNum, message: `Unit '${row["Unit"]}' not found` });
        continue;
      }

      const statusStr = (row["Status"] || "DRAFT").toUpperCase();
      const status = ["DRAFT", "ACTIVE", "ARCHIVED"].includes(statusStr) ? (statusStr as "DRAFT" | "ACTIVE" | "ARCHIVED") : "DRAFT";

      const minStockStr = row["Min Stock"] || "0";
      const minStockLevel = isNaN(parseInt(minStockStr)) ? 0 : parseInt(minStockStr);

      // Create product with default variant
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            sku: row["SKU"],
            name: row["Name"],
            description: row["Description"] || null,
            categoryId,
            unitId,
            status,
            minStockLevel,
            companyId: user.companyId,
          },
        });

        // Parse price from CSV, default to 0
        const priceStr = row["Price"] || "0";
        const price = isNaN(parseFloat(priceStr)) ? 0 : parseFloat(priceStr);
        
        const costStr = row["Cost"];
        const cost = costStr && !isNaN(parseFloat(costStr)) ? parseFloat(costStr) : null;

        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: row["SKU"], // default variant shares product SKU
            name: "Default",
            price,
            cost,
          },
        });
      });

      result.imported++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (result.imported > 0) {
    await logActivity({
      userId: user.id,
      companyId: user.companyId,
      action: "CREATED",
      entityType: "Product",
      entityId: "batch",
      details: `Imported ${result.imported} products from CSV`,
    });
    revalidatePath("/products");
  }

  return result;
}

export async function importCustomersCSV(csvString: string): Promise<ImportResult> {
  const user = await requireCompany();
  await requirePermission("customers:write");

  const { parseCSV } = await import("@/lib/csv");
  const { rows } = parseCSV(csvString);
  const result: ImportResult = { imported: 0, errors: [] };

  if (rows.length === 0) {
    result.errors.push({ row: 0, message: "No data found in CSV" });
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      if (!row["Name"]) {
        result.errors.push({ row: rowNum, message: "Missing required field: Name" });
        continue;
      }

      await prisma.customer.create({
        data: {
          companyId: user.companyId,
          name: row["Name"],
          email: row["Email"] || null,
          phone: row["Phone"] || null,
          taxId: row["Tax ID"] || null,
          address: row["Address"] || null,
          paymentTerms: row["Payment Terms"] ? parseInt(row["Payment Terms"]) : null,
          creditLimit: row["Credit Limit"] ? parseFloat(row["Credit Limit"]) : null,
        },
      });

      result.imported++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (result.imported > 0) {
    revalidatePath("/catalog/customers");
  }

  return result;
}

export async function importSuppliersCSV(csvString: string): Promise<ImportResult> {
  const user = await requireCompany();
  await requirePermission("suppliers:write");

  const { parseCSV } = await import("@/lib/csv");
  const { rows } = parseCSV(csvString);
  const result: ImportResult = { imported: 0, errors: [] };

  if (rows.length === 0) {
    result.errors.push({ row: 0, message: "No data found in CSV" });
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      if (!row["Name"]) {
        result.errors.push({ row: rowNum, message: "Missing required field: Name" });
        continue;
      }

      await prisma.supplier.create({
        data: {
          companyId: user.companyId,
          name: row["Name"],
          email: row["Email"] || null,
          phone: row["Phone"] || null,
          taxId: row["Tax ID"] || null,
          address: row["Address"] || null,
          paymentTerms: row["Payment Terms"] ? parseInt(row["Payment Terms"]) : null,
        },
      });

      result.imported++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (result.imported > 0) {
    revalidatePath("/catalog/suppliers");
  }

  return result;
}

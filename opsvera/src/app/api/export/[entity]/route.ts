import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import Papa from "papaparse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const user = await requireCompany();
    const resolvedParams = await params;
    const entity = resolvedParams.entity; // "products", "customers", "suppliers"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = [];

    switch (entity) {
      case "products":
        await requirePermission("products:read");
        const products = await prisma.product.findMany({
          where: { companyId: user.companyId },
          include: { category: true, unit: true },
        });
        // Flatten
        data = products.map(p => ({
          ID: p.id,
          SKU: p.sku,
          Name: p.name,
          Category: p.category?.name || "",
          Unit: p.unit?.code || "",
          Status: p.status,
          MinStock: p.minStockLevel,
          Barcode: p.barcode || "",
        }));
        break;
      case "customers":
        await requirePermission("customers:read");
        const customers = await prisma.customer.findMany({
          where: { companyId: user.companyId },
        });
        data = customers.map(c => ({
          ID: c.id,
          Name: c.name,
          Email: c.email || "",
          Phone: c.phone || "",
          TaxId: c.taxId || "",
          Address: c.address || "",
          PaymentTerms: c.paymentTerms || "",
          CreditLimit: c.creditLimit || "",
        }));
        break;
      case "suppliers":
        await requirePermission("suppliers:read");
        const suppliers = await prisma.supplier.findMany({
          where: { companyId: user.companyId },
        });
        data = suppliers.map(s => ({
          ID: s.id,
          Name: s.name,
          Email: s.email || "",
          Phone: s.phone || "",
          TaxId: s.taxId || "",
          Address: s.address || "",
          PaymentTerms: s.paymentTerms || "",
        }));
        break;
      default:
        return new NextResponse("Invalid entity", { status: 400 });
    }

    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${entity}_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error(`Export failed:`, error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error", 
      { status: 500 }
    );
  }
}

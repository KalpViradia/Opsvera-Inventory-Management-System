import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/invoice-document";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/rbac";
import React from "react";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCompany();
    await requirePermission("sales:read");
    
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const order = await prisma.salesOrder.findUnique({
      where: { 
        id: orderId,
        companyId: user.companyId 
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { name: true }
    });

    const stream = await renderToStream(
      <InvoiceDocument order={order as React.ComponentProps<typeof InvoiceDocument>["order"]} companyName={company?.name || "Company"} />
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice_${order.soNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}

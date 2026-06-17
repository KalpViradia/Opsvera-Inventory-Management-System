import { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasPermission, requireCompany, requirePermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConvertQuotationButton } from "@/components/sales/convert-quotation-button";

export const metadata: Metadata = {
  title: "Quotation Details | Opsvera",
  description: "View sales quotation details",
};

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCompany();
  await requirePermission("sales:read");
  const canWrite = await hasPermission("sales:write");
  const { id } = await params;

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
    notFound();
  }

  function formatCurrency(amount: string | number | { toString(): string }) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: quotation?.currency || "USD",
    }).format(Number(amount));
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{quotation.qtNumber}</h2>
            <Badge
              variant={
                quotation.status === "ACCEPTED" ? "default" :
                quotation.status === "DRAFT" ? "secondary" :
                quotation.status === "REJECTED" || quotation.status === "EXPIRED" ? "destructive" :
                "outline"
              }
              className={quotation.status === "ACCEPTED" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {quotation.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {format(quotation.createdAt, "PPP")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          {canWrite && quotation.status === "ACCEPTED" && (
            <ConvertQuotationButton quotationId={quotation.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-4 py-3 font-medium text-right">Discount</th>
                      <th className="px-4 py-3 font-medium text-right">Tax %</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotation.items.map((item) => (
                      <tr key={item.id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.discount)}</td>
                        <td className="px-4 py-3 text-right">{Number(item.taxRate)}%</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-base">{quotation.customer.name}</p>
                {quotation.customer.email && <p className="text-muted-foreground">{quotation.customer.email}</p>}
                {quotation.customer.phone && <p className="text-muted-foreground">{quotation.customer.phone}</p>}
              </div>
              <div className="pt-4 border-t">
                <p className="text-muted-foreground mb-1">Valid Until</p>
                <p className="font-medium">{format(quotation.validUntil, "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Discount</span>
                <span>{formatCurrency(quotation.discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tax</span>
                <span>{formatCurrency(quotation.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-3">
                <span>Grand Total</span>
                <span className="text-primary">{formatCurrency(quotation.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

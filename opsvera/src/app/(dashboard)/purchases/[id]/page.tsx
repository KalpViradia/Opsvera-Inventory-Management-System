import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Store, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPurchaseOrderById } from "@/actions/purchases";
import { StatusBadge, StatusVariant } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GRNForm } from "@/components/purchases/grn-dialog";
import { format } from "date-fns";
import { ActionButtons } from "./action-buttons"; // A client component we'll need for Submit/Approve/Cancel
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { PaymentDialog } from "@/components/shared/payment-dialog";

export const metadata: Metadata = {
  title: "Purchase Order Details | Opsvera",
  description: "View and manage purchase order",
};

interface PurchaseOrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
  const { id } = await params;
  const { data: po } = await getPurchaseOrderById(id);
  
  if (!po) {
    notFound();
  }

  const { prisma } = await import("@/lib/prisma");
  const { requireCompany, hasPermission } = await import("@/lib/rbac");
  const companyUser = await requireCompany();
  const canWrite = await hasPermission("purchases:write");
  const canApprove = await hasPermission("purchases:approve");
  const canReceive = await hasPermission("inventory:write");
  
  // Fetch all active locations with their warehouse names for GRN dropdown
  const allLocations = await prisma.location.findMany({
    where: { companyId: companyUser.companyId, isActive: true },
    include: { warehouse: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const locations = allLocations.map((l) => ({
    id: l.id,
    name: l.name,
    warehouse: { name: l.warehouse.name }
  }));



  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{po.poNumber}</h2>
            <StatusBadge status={po.status.toLowerCase() as StatusVariant} />
          </div>
          <p className="text-muted-foreground flex items-center mt-1">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Created on {format(new Date(po.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Action buttons based on status */}
          <ActionButtons poId={po.id} currentStatus={po.status} canWrite={canWrite} canApprove={canApprove} />

          {(po.status === "APPROVED" || po.status === "RECEIVED") && canReceive && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Box className="mr-2 h-4 w-4" /> Receive Goods
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Goods Receipt Note (GRN)</DialogTitle>
                </DialogHeader>
                <GRNForm poId={po.id} items={po.items as unknown as React.ComponentProps<typeof GRNForm>['items']} locations={locations} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Left Column - Details */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Store className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{po.supplier.name}</p>
                  {po.supplier.email && <p className="text-muted-foreground">{po.supplier.email}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">{po.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax Amount</span>
                <span className="font-medium">${Number(po.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t pt-3 mt-1">
                <span>Grand Total</span>
                <span>${Number(po.totalAmount).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{po.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Invoices Section */}
          {po.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {po.invoices.map((inv: any) => (
                  <div key={inv.id} className="flex flex-col gap-2 p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{inv.invoiceNumber}</span>
                      <StatusBadge status={inv.status.toLowerCase() as StatusVariant} />
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Total: ${Number(inv.amount).toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        {inv.status !== "PAID" && (
                          <PaymentDialog 
                            invoiceId={inv.id} 
                            invoiceType="PURCHASE" 
                            totalAmount={Number(inv.amount)} 
                            paidAmount={Number(inv.paidAmount)}
                          />
                        )}
                        <DownloadInvoiceButton invoiceId={inv.id} type="purchase" size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Line Items */}
        <div className="md:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Products ordered and received quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-4 py-3 font-medium text-right">Tax Rate</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Received</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {po.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{Number(item.taxRate)}%</td>
                        <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={item.receivedQty === item.quantity ? "text-emerald-600 font-medium" : item.receivedQty > 0 ? "text-amber-600 font-medium" : ""}>
                            {item.receivedQty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">${Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

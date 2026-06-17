/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSalesOrderById } from "@/actions/sales";
import { StatusBadge, StatusVariant } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShipDialog } from "@/components/sales/ship-dialog";
import { format } from "date-fns";
import { ActionButtons } from "./action-buttons";
import { DownloadInvoiceButton } from "@/components/shared/download-invoice-button";
import { PaymentDialog } from "@/components/shared/payment-dialog";
import { CreateShipmentButton } from "@/components/sales/create-shipment-button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sales Order Details | Opsvera",
  description: "View and manage sales order",
};

interface SalesOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SalesOrderDetailPage({ params }: SalesOrderDetailPageProps) {
  const { id } = await params;
  const { data: so } = await getSalesOrderById(id);
  
  if (!so) {
    notFound();
  }

  const { prisma } = await import("@/lib/prisma");
  const { requireCompany } = await import("@/lib/rbac");
  const companyUser = await requireCompany();
  
  // Fetch all active locations with their warehouse names for shipping dropdown
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
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{so.soNumber}</h2>
            <StatusBadge status={so.status.toLowerCase() as StatusVariant} />
          </div>
          <p className="text-muted-foreground flex items-center mt-1">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Created on {format(new Date(so.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Action buttons based on status */}
          <ActionButtons soId={so.id} currentStatus={so.status} />

          {(so.status === "CONFIRMED" || so.status === "PACKED") && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Truck className="mr-2 h-4 w-4" /> Ship Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ship Sales Order</DialogTitle>
                </DialogHeader>
                <ShipDialog 
                  soId={so.id} 
                  items={so.items.map((item: any) => ({
                    id: item.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    product: item.product
                  }))} 
                  locations={locations} 
                />
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
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{so.customer.name}</p>
                  {so.customer.email && <p className="text-muted-foreground">{so.customer.email}</p>}
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
                <span className="font-medium">{so.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax Amount</span>
                <span className="font-medium">${Number(so.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-destructive">-${Number(so.discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t pt-3 mt-1">
                <span>Grand Total</span>
                <span>${Number(so.totalAmount).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {so.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{so.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Shipments Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Fulfillment</CardTitle>
              {so.status === "CONFIRMED" && so.shipments.length === 0 && (
                <CreateShipmentButton soId={so.id} />
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {so.shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No shipments yet</p>
              ) : (
                so.shipments.map((shipment: any) => (
                  <div key={shipment.id} className="flex flex-col gap-2 p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{shipment.shipmentNumber}</span>
                      </div>
                      <Badge variant="outline">{shipment.status}</Badge>
                    </div>
                    {shipment.trackingNumber && (
                      <p className="text-xs text-muted-foreground">Tracking: {shipment.trackingNumber}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Invoices Section */}
          {so.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {so.invoices.map((inv: any) => (
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
                            invoiceType="SALES" 
                            totalAmount={Number(inv.amount)} 
                            paidAmount={Number(inv.paidAmount)}
                          />
                        )}
                        <DownloadInvoiceButton invoiceId={inv.id} type="sales" size="sm" />
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
              <CardDescription>Products ordered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-4 py-3 font-medium text-right">Disc.</th>
                      <th className="px-4 py-3 font-medium text-right">Tax Rate</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {so.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${Number(item.discount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{Number(item.taxRate)}%</td>
                        <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
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

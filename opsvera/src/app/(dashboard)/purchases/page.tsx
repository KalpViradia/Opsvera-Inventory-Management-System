/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { Plus, ShoppingBag } from "lucide-react";
import { getPurchaseOrders } from "@/actions/purchases";
import { POTable } from "@/components/purchases/po-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/rbac";

import { exportPurchaseOrdersCSV } from "@/actions/export";
import { CSVExportButton } from "@/components/shared/csv-export-button";

export const metadata: Metadata = {
  title: "Purchase Orders | Opsvera",
  description: "Manage your purchase orders and procurement",
};

export default async function PurchasesPage() {
  await requirePermission("purchases:read");
  const canWrite = await hasPermission("purchases:write");
  const { data: purchaseOrders } = await getPurchaseOrders();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">
            Create and manage purchase orders to vendors.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <CSVExportButton exportAction={exportPurchaseOrdersCSV} filename="purchase_orders_export" />
          {canWrite && (
            <Button asChild>
              <Link href="/purchases/new">
                <Plus className="mr-2 h-4 w-4" /> Create PO
              </Link>
            </Button>
          )}
        </div>
      </div>

      {purchaseOrders.length === 0 ? (
        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No purchase orders found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              You haven&apos;t created any purchase orders yet. Create one to start tracking procurement.
            </p>
            {canWrite && (
              <Button asChild>
                <Link href="/purchases/new">
                  <Plus className="mr-2 h-4 w-4" /> Create PO
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-4">
          <POTable data={JSON.parse(JSON.stringify(purchaseOrders.map((po: any) => ({
            ...po,
            totalAmount: po.totalAmount ? Number(po.totalAmount) : 0,
            taxAmount: po.taxAmount ? Number(po.taxAmount) : 0
          })))) as any} />
        </div>
      )}
    </div>
  );
}

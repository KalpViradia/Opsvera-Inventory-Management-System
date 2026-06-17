/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { Plus, ShoppingCart } from "lucide-react";
import { getSalesOrders } from "@/actions/sales";
import { SOTable } from "@/components/sales/so-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/rbac";

import { exportSalesOrdersCSV } from "@/actions/export";
import { CSVExportButton } from "@/components/shared/csv-export-button";

export const metadata: Metadata = {
  title: "Sales Orders | Opsvera",
  description: "Manage your sales orders and outbound shipments",
};

export default async function SalesPage() {
  await requirePermission("sales:read");
  const canWrite = await hasPermission("sales:write");
  const { data: salesOrders } = await getSalesOrders();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales Orders</h2>
          <p className="text-muted-foreground">
            Create quotations, manage sales orders, and track shipments.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <CSVExportButton exportAction={exportSalesOrdersCSV} filename="sales_orders_export" />
          {canWrite && (
            <Button asChild>
              <Link href="/sales/new">
                <Plus className="mr-2 h-4 w-4" /> Create SO
              </Link>
            </Button>
          )}
        </div>
      </div>

      {salesOrders.length === 0 ? (
        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No sales orders found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              You haven&apos;t created any sales orders yet. Create one to start tracking sales.
            </p>
            {canWrite && (
              <Button asChild>
                <Link href="/sales/new">
                  <Plus className="mr-2 h-4 w-4" /> Create SO
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-4">
          <SOTable data={JSON.parse(JSON.stringify(salesOrders.map((so: any) => ({
            ...so,
            totalAmount: so.totalAmount ? Number(so.totalAmount) : 0,
            taxAmount: so.taxAmount ? Number(so.taxAmount) : 0,
            discount: so.discount ? Number(so.discount) : 0,
            customer: so.customer ? { ...so.customer, creditLimit: so.customer.creditLimit ? Number(so.customer.creditLimit) : null } : null
          })))) as any} />
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";

import { getStockEntries } from "@/actions/inventory";
import { getProducts } from "@/actions/products";
import { hasPermission, requireCompany } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { StockHistoryTable } from "@/components/inventory/stock-history-table";
import { StockEntryDialog } from "@/components/inventory/stock-entry-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stock Entries | Opsvera",
  description: "View and create stock movements",
};

export default async function StockEntriesPage() {
  const user = await requireCompany();
  const canWrite = await hasPermission("inventory:write");
  
  const { data: entries } = await getStockEntries();
  const { data: products } = await getProducts({ limit: 100 }); // Getting a reasonable amount of products
  
  // Fetch warehouses with locations for the dropdown
  const warehouses = await prisma.warehouse.findMany({
    where: { companyId: user.companyId! },
    include: {
      locations: {
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Movements</h2>
          <p className="text-muted-foreground">
            History of receipts, deliveries, transfers, and adjustments.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory">Back to Stock</Link>
          </Button>
          
          {canWrite && <StockEntryDialog products={JSON.parse(JSON.stringify(products))} warehouses={warehouses} />}
        </div>
      </div>

      <div className="pt-4">
        { }
        <StockHistoryTable data={JSON.parse(JSON.stringify(entries))} />
      </div>
    </div>
  );
}

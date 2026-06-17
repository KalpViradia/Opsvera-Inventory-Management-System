/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { Package, ArrowRightLeft } from "lucide-react";
import { getStockLevels } from "@/actions/inventory";
import { StockLevelTable } from "@/components/inventory/stock-level-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requirePermission } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Inventory | Opsvera",
  description: "View and manage stock levels",
};

export default async function InventoryPage() {
  await requirePermission("inventory:read");
  const { data: stockLevels } = await getStockLevels();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Current stock levels across all warehouses and locations.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/entries">
              <ArrowRightLeft className="mr-2 h-4 w-4" /> History
            </Link>
          </Button>
        </div>
      </div>

      <div className="pt-4">
        {stockLevels.length === 0 ? (
          <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No stock available</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                You haven&apos;t received any inventory yet. Create a stock entry to start tracking items.
              </p>
              <Button asChild>
                <Link href="/inventory/entries">Go to Stock Entries</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            { }
            <StockLevelTable data={JSON.parse(JSON.stringify(stockLevels))} />
          </>
        )}
      </div>
    </div>
  );
}



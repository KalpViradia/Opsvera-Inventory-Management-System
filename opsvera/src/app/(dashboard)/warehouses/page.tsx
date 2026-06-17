import { Metadata } from "next";
import { Box } from "lucide-react";
import { getWarehouses } from "@/actions/warehouses";
import { WarehouseCard } from "@/components/warehouses/warehouse-card";
import { WarehouseDialog } from "@/components/warehouses/warehouse-dialog";
import { hasPermission, requirePermission } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Warehouses | Opsvera",
  description: "Manage your physical storage locations",
};

export default async function WarehousesPage() {
  await requirePermission("inventory:read");
  const canWrite = await hasPermission("inventory:write");
  const { data: warehouses } = await getWarehouses();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground">
            Manage physical locations and storage zones.
          </p>
        </div>
        
        {canWrite && <WarehouseDialog />}
      </div>

      {warehouses.length === 0 ? (
        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Box className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No warehouses created</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              You haven&apos;t defined any physical storage locations yet. Create your first warehouse to start tracking stock.
            </p>
            {canWrite && <WarehouseDialog />}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
          {warehouses.map((warehouse) => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} />
          ))}
        </div>
      )}
    </div>
  );
}



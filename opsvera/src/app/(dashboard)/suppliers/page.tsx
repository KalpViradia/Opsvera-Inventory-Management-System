import { Metadata } from "next";
import { Users } from "lucide-react";
import { getSuppliers } from "@/actions/suppliers";
import { getCustomFields } from "@/actions/custom-fields";
import { SupplierTable } from "@/components/suppliers/supplier-table";
import { SupplierDialog } from "@/components/suppliers/supplier-dialog";

import { hasPermission, requirePermission } from "@/lib/rbac";
import { importSuppliersCSV } from "@/actions/import";
import { exportSuppliersCSV } from "@/actions/export";
import { CSVImportDialog } from "@/components/shared/csv-import-dialog";
import { CSVExportButton } from "@/components/shared/csv-export-button";

export const metadata: Metadata = {
  title: "Suppliers | Opsvera",
  description: "Manage your supplier and vendor data",
};

export default async function SuppliersPage() {
  await requirePermission("suppliers:read");
  const canWrite = await hasPermission("suppliers:write");
  const [{ data: suppliers }, { data: customFields }] = await Promise.all([
    getSuppliers(),
    getCustomFields("suppliers")
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground">
            Manage your vendor master data and payment terms.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <CSVImportDialog 
                importAction={importSuppliersCSV} 
                title="Import Suppliers"
                description="Upload a CSV file to bulk import suppliers."
                templateHeaders={["Name", "Email", "Phone", "Tax ID", "Address", "Payment Terms"]}
              />
              <CSVExportButton exportAction={exportSuppliersCSV} filename="suppliers_export" />
              <SupplierDialog customFields={customFields || []} />
            </>
          )}
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No suppliers found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              You haven&apos;t added any suppliers yet. Create your first supplier to start managing procurement.
            </p>
            {canWrite && <SupplierDialog customFields={customFields || []} />}
          </div>
        </div>
      ) : (
        <div className="pt-4">
          <SupplierTable data={suppliers} />
        </div>
      )}
    </div>
  );
}



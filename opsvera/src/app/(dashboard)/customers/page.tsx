/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { Users } from "lucide-react";
import { getCustomers } from "@/actions/customers";
import { getCustomFields } from "@/actions/custom-fields";
import { getPriceLists } from "@/actions/price-lists";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerDialog } from "@/components/customers/customer-dialog";

import { hasPermission, requirePermission } from "@/lib/rbac";
import { importCustomersCSV } from "@/actions/import";
import { exportCustomersCSV } from "@/actions/export";
import { CSVImportDialog } from "@/components/shared/csv-import-dialog";
import { CSVExportButton } from "@/components/shared/csv-export-button";

export const metadata: Metadata = {
  title: "Customers | Opsvera",
  description: "Manage your customer data",
};

export default async function CustomersPage() {
  await requirePermission("customers:read");
  const canWrite = await hasPermission("customers:write");
  const [{ data: customers }, { data: customFields }, priceLists] = await Promise.all([
    getCustomers(),
    getCustomFields("customers"),
    getPriceLists()
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer master data and credit limits.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <CSVImportDialog 
                importAction={importCustomersCSV} 
                title="Import Customers"
                description="Upload a CSV file to bulk import customers."
                templateHeaders={["Name", "Email", "Phone", "Tax ID", "Address", "Payment Terms", "Credit Limit"]}
              />
              <CSVExportButton exportAction={exportCustomersCSV} filename="customers_export" />
              <CustomerDialog customFields={customFields || []} priceLists={priceLists} />
            </>
          )}
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No customers found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              You haven&apos;t added any customers yet. Create your first customer to start tracking sales.
            </p>
            {canWrite && <CustomerDialog customFields={customFields || []} priceLists={priceLists} />}
          </div>
        </div>
      ) : (
        <div className="pt-4">
          <CustomerTable data={JSON.parse(JSON.stringify(customers.map((c: any) => ({...c, creditLimit: c.creditLimit ? Number(c.creditLimit) : null})))) as any} />
        </div>
      )}
    </div>
  );
}



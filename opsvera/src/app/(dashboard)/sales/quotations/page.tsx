import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { hasPermission, requirePermission } from "@/lib/rbac";
import { getQuotations } from "@/actions/quotations";

export const metadata: Metadata = {
  title: "Quotations | Opsvera",
  description: "Manage sales quotations and estimates",
};

export default async function QuotationsPage() {
  await requirePermission("sales:read");
  const canWrite = await hasPermission("sales:write");

  const { data } = await getQuotations();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground mt-1">
            Manage sales estimates and convert them to orders.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canWrite && (
            <Link href="/sales/quotations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="text" placeholder="Search quotations..." />
          <Button type="button" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Quote #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Valid Until</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.quotations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No quotations found. Create your first one.
                </td>
              </tr>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.quotations.map((qt: any) => (
                <tr key={qt.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/sales/quotations/${qt.id}`} className="hover:underline text-primary">
                      {qt.qtNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{qt.customer.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(qt.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(qt.validUntil, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        qt.status === "ACCEPTED" ? "default" :
                        qt.status === "DRAFT" ? "secondary" :
                        qt.status === "REJECTED" || qt.status === "EXPIRED" ? "destructive" :
                        "outline"
                      }
                      className={qt.status === "ACCEPTED" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                    >
                      {qt.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: qt.currency,
                    }).format(Number(qt.totalAmount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

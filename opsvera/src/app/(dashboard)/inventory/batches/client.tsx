"use client";


import { format, isPast, isToday, addDays } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle } from "lucide-react";
import type { Batch, Product } from "@prisma/client";

type BatchWithProduct = Batch & { product: Product };

export function BatchesClient({ data }: { data: BatchWithProduct[] }) {
  const columns: ColumnDef<BatchWithProduct>[] = [
    {
      accessorKey: "batchNumber",
      header: "Batch Number",
      cell: ({ row }) => <div className="font-medium">{row.original.batchNumber}</div>,
    },
    {
      accessorKey: "product.name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span>{row.original.product.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => <div>{row.original.quantity}</div>,
    },
    {
      accessorKey: "manufacturedAt",
      header: "Mfg Date",
      cell: ({ row }) => (
        <div>
          {row.original.manufacturedAt
            ? format(new Date(row.original.manufacturedAt), "MMM d, yyyy")
            : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expiry Date",
      cell: ({ row }) => {
        const date = row.original.expiresAt;
        if (!date) return <span className="text-muted-foreground">N/A</span>;

        const expiresDate = new Date(date);
        const isExpired = isPast(expiresDate) && !isToday(expiresDate);
        const expiresSoon = !isExpired && expiresDate <= addDays(new Date(), 30);

        return (
          <div className="flex items-center gap-2">
            <span>{format(expiresDate, "MMM d, yyyy")}</span>
            {isExpired && (
              <Badge variant="destructive" className="flex gap-1 items-center">
                <AlertTriangle className="w-3 h-3" /> Expired
              </Badge>
            )}
            {expiresSoon && (
              <Badge variant="outline" className="text-orange-500 border-orange-500 flex gap-1 items-center">
                <AlertTriangle className="w-3 h-3" /> Soon
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={data} searchKey="batchNumber" />
    </div>
  );
}

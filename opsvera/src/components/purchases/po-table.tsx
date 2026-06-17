"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge, StatusVariant } from "@/components/shared/status-badge";
import { PurchaseOrder, Supplier } from "@prisma/client";

type POWithSupplier = PurchaseOrder & {
  supplier: Supplier;
  _count?: { items: number };
};

interface POTableProps {
  data: POWithSupplier[];
}

export function POTable({ data }: POTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                No purchase orders found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.poNumber}</TableCell>
                <TableCell>{format(new Date(po.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell>{po.supplier.name}</TableCell>
                <TableCell>
                  <StatusBadge status={po.status.toLowerCase() as StatusVariant} />
                </TableCell>
                <TableCell className="text-right">
                  ${Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {po._count?.items || 0}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/purchases/${po.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

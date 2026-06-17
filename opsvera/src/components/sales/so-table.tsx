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
import { SalesOrder, Customer } from "@prisma/client";

type SOWithCustomer = SalesOrder & {
  customer: Customer;
  _count?: { items: number };
};

interface SOTableProps {
  data: SOWithCustomer[];
}

export function SOTable({ data }: SOTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SO Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
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
                No sales orders found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((so) => (
              <TableRow key={so.id}>
                <TableCell className="font-medium">{so.soNumber}</TableCell>
                <TableCell>{format(new Date(so.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell>{so.customer.name}</TableCell>
                <TableCell>
                  <StatusBadge status={so.status.toLowerCase() as StatusVariant} />
                </TableCell>
                <TableCell className="text-right">
                  ${Number(so.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {so._count?.items || 0}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/sales/${so.id}`}>
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

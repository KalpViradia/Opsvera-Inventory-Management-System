"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Customer } from "@prisma/client";

interface CustomerTableProps {
  data: Customer[];
}

export function CustomerTable({ data }: CustomerTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Terms</TableHead>
            <TableHead>Credit Limit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="font-medium">{customer.name}</div>
                  {customer.taxId && <div className="text-xs text-muted-foreground">Tax ID: {customer.taxId}</div>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.email || "-"}</div>
                  <div className="text-xs text-muted-foreground">{customer.phone || "-"}</div>
                </TableCell>
                <TableCell>
                  {customer.paymentTerms ? `Net ${customer.paymentTerms}` : "-"}
                </TableCell>
                <TableCell>
                  {customer.creditLimit ? `$${Number(customer.creditLimit).toFixed(2)}` : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={customer.isActive ? "default" : "secondary"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/customers/${customer.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

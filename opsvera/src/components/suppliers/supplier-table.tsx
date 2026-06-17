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
import { Supplier } from "@prisma/client";

interface SupplierTableProps {
  data: Supplier[];
}

export function SupplierTable({ data }: SupplierTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Terms</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                No suppliers found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <div className="font-medium">{supplier.name}</div>
                  {supplier.taxId && <div className="text-xs text-muted-foreground">Tax ID: {supplier.taxId}</div>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{supplier.email || "-"}</div>
                  <div className="text-xs text-muted-foreground">{supplier.phone || "-"}</div>
                </TableCell>
                <TableCell>
                  {supplier.paymentTerms ? `Net ${supplier.paymentTerms}` : "-"}
                </TableCell>
                <TableCell>
                  {supplier.rating ? (
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{supplier.rating}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={supplier.isActive ? "default" : "secondary"}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/suppliers/${supplier.id}`}>
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

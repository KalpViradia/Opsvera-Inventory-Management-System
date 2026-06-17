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
import { format } from "date-fns";

type StockEntryData = {
  id: string;
  type: string;
  quantity: number;
  createdAt: Date;
  notes: string | null;
  product: { name: string; sku: string };
  fromLocation: { name: string; warehouse: { name: string } } | null;
  toLocation: { name: string; warehouse: { name: string } } | null;
};

export function StockHistoryTable({ data }: { data: StockEntryData[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                No stock history found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{format(new Date(item.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                </TableCell>
                <TableCell>
                  {item.fromLocation ? (
                    <>
                      <div>{item.fromLocation.warehouse.name}</div>
                      <div className="text-xs text-muted-foreground">{item.fromLocation.name}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.toLocation ? (
                    <>
                      <div>{item.toLocation.warehouse.name}</div>
                      <div className="text-xs text-muted-foreground">{item.toLocation.name}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.type === "RECEIPT" ? "+" : item.type === "DELIVERY" || item.type === "SCRAP" ? "-" : ""}
                  {item.quantity}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate" title={item.notes || ""}>
                  {item.notes || "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

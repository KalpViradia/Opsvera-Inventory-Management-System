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

type StockLevelData = {
  id: string;
  quantity: number;
  product: {
    name: string;
    sku: string;
    unit: { name: string; code: string };
  };
  location: {
    name: string;
    warehouse: {
      name: string;
    };
  };
};

export function StockLevelTable({ data }: { data: StockLevelData[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                No stock levels found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product.name}</TableCell>
                <TableCell>{item.product.sku}</TableCell>
                <TableCell>{item.location.warehouse.name}</TableCell>
                <TableCell>{item.location.name}</TableCell>
                <TableCell className="text-right">
                  {item.quantity} {item.product.unit.code}
                </TableCell>
                <TableCell>
                  {item.quantity > 10 ? (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">In Stock</Badge>
                  ) : item.quantity > 0 ? (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">Low Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

import { Metadata } from "next";
import { format } from "date-fns";
import { Hash, Package2, Tag } from "lucide-react";

import { requirePermission } from "@/lib/rbac";
import { getSerialNumbers } from "@/actions/inventory";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Serial Numbers | Opsvera",
  description: "Track individual high-value items via serial numbers",
};

export default async function SerialNumbersPage() {
  await requirePermission("inventory:read");
  
  const { data: serials } = await getSerialNumbers();

  if (!serials) return null;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Serial Numbers</h2>
          <p className="text-muted-foreground mt-1">
            Track lifecycle and status of individual high-value inventory items.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-500" />
            Serial Number Ledger
          </CardTitle>
          <CardDescription>
            Chronological log of all recorded serial numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recorded On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No serial numbers recorded. Scan or enter serials when receiving stock.
                  </TableCell>
                </TableRow>
              ) : (
                serials.map((sn: any) => {
                  return (
                    <TableRow key={sn.id}>
                      <TableCell className="font-medium font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {sn.serialNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package2 className="w-4 h-4 text-muted-foreground" />
                          <span>{sn.product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sn.status === "IN_STOCK" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">In Stock</Badge>
                        ) : sn.status === "SOLD" ? (
                          <Badge variant="outline" className="text-indigo-500 border-indigo-500">Sold</Badge>
                        ) : sn.status === "RETURNED" ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">Returned</Badge>
                        ) : (
                          <Badge variant="destructive">{sn.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sn.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

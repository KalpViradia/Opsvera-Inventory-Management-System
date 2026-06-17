"use client";

import { useState } from "react";
import { ShipmentStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateShipmentStatus } from "@/actions/shipments";
import { toast } from "sonner";
import { ArrowRight, Package, Truck, CheckCircle2, Clock, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ShipmentsClient({ initialData }: { initialData: (import("@prisma/client").Shipment & { items: import("@prisma/client").ShipmentItem[], salesOrder: import("@prisma/client").SalesOrder & { customer: import("@prisma/client").Customer } })[] }) {
  const [shipments, setShipments] = useState(initialData);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const columns: { id: ShipmentStatus; title: string; icon: React.ElementType; color: string }[] = [
    { id: "PENDING", title: "Pending", icon: Clock, color: "bg-slate-100 text-slate-700" },
    { id: "PICKING", title: "Picking", icon: Box, color: "bg-blue-100 text-blue-700" },
    { id: "PACKED", title: "Packed", icon: Package, color: "bg-indigo-100 text-indigo-700" },
    { id: "SHIPPED", title: "Shipped", icon: Truck, color: "bg-emerald-100 text-emerald-700" },
    { id: "DELIVERED", title: "Delivered", icon: CheckCircle2, color: "bg-zinc-100 text-zinc-700" },
  ];

  const handleMove = async (shipmentId: string, currentStatus: ShipmentStatus) => {
    const currentIndex = columns.findIndex(c => c.id === currentStatus);
    if (currentIndex === -1 || currentIndex === columns.length - 1) return;
    
    const nextStatus = columns[currentIndex + 1].id;
    setIsLoading(shipmentId);
    
    try {
      await updateShipmentStatus(shipmentId, nextStatus);
      toast.success(`Shipment moved to ${nextStatus}`);
      setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status: nextStatus } : s));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update shipment");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-180px)] items-start">
      {columns.map(col => {
        const columnShipments = shipments.filter(s => s.status === col.id);
        const Icon = col.icon;
        
        return (
          <div key={col.id} className="flex-shrink-0 w-80 bg-muted/40 rounded-xl border p-4 flex flex-col max-h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-md", col.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold">{col.title}</h3>
              </div>
              <Badge variant="secondary" className="rounded-full">{columnShipments.length}</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {columnShipments.map(shipment => (
                <Card key={shipment.id} className="shadow-sm border-muted-foreground/20">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium">
                      {shipment.shipmentNumber}
                    </CardTitle>
                    <Link href={`/sales/${shipment.salesOrderId}`} className="text-xs text-primary hover:underline">
                      SO: {shipment.salesOrder.soNumber}
                    </Link>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {shipment.salesOrder.customer.name}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {shipment.items.reduce((sum: number, item: import("@prisma/client").ShipmentItem) => sum + item.quantity, 0)} items to fulfill
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 pt-0 flex justify-end">
                    {col.id !== "DELIVERED" && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs w-full justify-between group"
                        disabled={isLoading === shipment.id}
                        onClick={() => handleMove(shipment.id, col.id)}
                      >
                        {isLoading === shipment.id ? "Updating..." : `Move to ${columns[columns.findIndex(c => c.id === col.id) + 1]?.title}`}
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {columnShipments.length === 0 && (
                <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                  No shipments
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

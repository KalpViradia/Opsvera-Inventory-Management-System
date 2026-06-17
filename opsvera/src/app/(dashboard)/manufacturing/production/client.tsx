"use client";

import { useState } from "react";
import { ProductionStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateProductionOrderStatus, createProductionOrder } from "@/actions/manufacturing";
import { toast } from "sonner";
import { ArrowRight, Settings, CheckCircle2, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

const prodSchema = z.object({
  bomId: z.string().min(1, "BOM is required"),
  quantityToProduce: z.coerce.number().int().positive("Must be at least 1"),
});

export function ProductionClient({ 
  initialData,
  boms,
  canWrite
}: { 
  initialData: (import("@prisma/client").ProductionOrder & { bom: import("@prisma/client").BOM & { product: import("@prisma/client").Product } })[];
  boms: (import("@prisma/client").BOM & { product: import("@prisma/client").Product })[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialData);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof prodSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(prodSchema) as any,
    defaultValues: {
      bomId: "",
      quantityToProduce: 1,
    },
  });

  const columns: { id: ProductionStatus; title: string; icon: React.ElementType; color: string }[] = [
    { id: "PLANNED", title: "Planned", icon: Clock, color: "bg-slate-100 text-slate-700" },
    { id: "IN_PROGRESS", title: "In Progress", icon: Settings, color: "bg-blue-100 text-blue-700" },
    { id: "COMPLETED", title: "Completed", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
  ];

  const handleMove = async (orderId: string, currentStatus: ProductionStatus) => {
    const currentIndex = columns.findIndex(c => c.id === currentStatus);
    if (currentIndex === -1 || currentIndex === columns.length - 1) return;
    
    const nextStatus = columns[currentIndex + 1].id;
    setIsLoading(orderId);
    
    try {
      await updateProductionOrderStatus(orderId, nextStatus);
      toast.success(`Order moved to ${nextStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update order");
    } finally {
      setIsLoading(null);
    }
  };

  const onSubmit = async (data: z.infer<typeof prodSchema>) => {
    try {
      await createProductionOrder(data);
      toast.success("Production order created");
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canWrite && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Production Order
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Production Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="bomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill of Materials</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select BOM to manufacture" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {boms.length > 0 ? boms.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} (Makes: {b.product.name})
                            </SelectItem>
                          )) : (
                            <SelectItem value="empty" disabled>
                              No Bill of Materials available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantityToProduce"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to Produce</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" {...field} value={field.value as number} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-230px)] items-start">
        {columns.map(col => {
          const columnOrders = orders.filter(o => o.status === col.id);
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
                <Badge variant="secondary" className="rounded-full">{columnOrders.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {columnOrders.map(order => (
                  <Card key={order.id} className="shadow-sm border-muted-foreground/20">
                    <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-medium">
                        {order.orderNumber}
                      </CardTitle>
                      <div className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                        Qty: {order.quantityToProduce}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 pb-2">
                      <p className="text-sm font-medium line-clamp-1">
                        {order.bom.product.name}
                      </p>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        BOM: {order.bom.name}
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0 flex justify-end">
                      {canWrite && col.id !== "COMPLETED" && col.id !== "CANCELLED" && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-xs w-full justify-between group"
                          disabled={isLoading === order.id}
                          onClick={() => handleMove(order.id, col.id)}
                        >
                          {isLoading === order.id ? "Updating..." : `Move to ${columns[columns.findIndex(c => c.id === col.id) + 1]?.title}`}
                          <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                
                {columnOrders.length === 0 && (
                  <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

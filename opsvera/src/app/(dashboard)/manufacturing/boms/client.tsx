"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBOM } from "@/actions/manufacturing";

const bomSchema = z.object({
  productId: z.string().min(1, "Finished good is required"),
  name: z.string().min(1, "BOM name is required"),
  version: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Component is required"),
      quantity: z.coerce.number().positive("Quantity must be positive"),
    })
  ).min(1, "At least one component is required"),
});

export function BomsClient({ 
  initialData, 
  products,
  canWrite

}: { 
  initialData: (import("@prisma/client").BOM & { product: import("@prisma/client").Product, _count: { items: number, productionOrders: number } })[];
  products: { id: string; name: string; sku: string }[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<z.infer<typeof bomSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bomSchema) as any,
    defaultValues: {
      name: "",
      version: "1.0",
      notes: "",
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: z.infer<typeof bomSchema>) => {
    try {
      await createBOM(data);
      toast.success("Bill of Materials created successfully");
      setIsOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create BOM");
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
                Create BOM
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bill of Materials</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finished Good</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product to build" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.length > 0 ? products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </SelectItem>
                            )) : (
                              <SelectItem value="empty" disabled>
                                No products available
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BOM Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Standard Assembly" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Components / Raw Materials</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ productId: "", quantity: 1 })}
                    >
                      <Plus className="w-3 h-3 mr-2" /> Add Component
                    </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-3 bg-muted/30 rounded-lg border border-muted">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">Component Product</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.length > 0 ? products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                  </SelectItem>
                                )) : (
                                  <SelectItem value="empty" disabled>
                                    No products available
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
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormLabel className="text-xs">Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" min="0.01" step="0.01" {...field} value={field.value as number} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {form.formState.errors.items?.root && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.items.root.message}
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Assembly instructions or notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save BOM"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {initialData.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 bg-muted/10 border-dashed">
          <Layers className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No Bill of Materials found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
            Create your first BOM to define how to assemble finished goods from raw materials.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialData.map((bom) => (
            <Card key={bom.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{bom.name}</CardTitle>
                    <p className="text-sm font-medium text-primary mt-1">
                      Makes: {bom.product.name}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                    v{bom.version}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Components</span>
                  <span className="font-medium">{bom._count.items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prod. Orders</span>
                  <span className="font-medium">{bom._count.productionOrders}</span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Created {format(new Date(bom.createdAt), "MMM d, yyyy")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

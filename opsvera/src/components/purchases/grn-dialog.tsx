"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { receivePOSchema } from "@/validations/purchase";
import { receivePurchaseOrder } from "@/actions/purchases";

// Mock Location type since we need it for the selector
type Location = { id: string; name: string; warehouse: { name: string } };

type POItem = {
  id: string;
  productId: string;
  product: { name: string; sku: string };
  quantity: number;
  receivedQty: number;
};

interface GRNDialogProps {
  poId: string;
  items: POItem[];
  locations: Location[];
  onSuccess?: () => void;
}

export function GRNForm({ poId, items, locations, onSuccess }: GRNDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Filter out items that are already fully received
  const pendingItems = items.filter(item => item.receivedQty < item.quantity);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof receivePOSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(receivePOSchema) as any,
    defaultValues: {
      locationId: "",
      notes: "",
      items: pendingItems.map(item => ({
        id: item.id,
        receiveQty: item.quantity - item.receivedQty, // Default to receiving remaining balance
      })),
    },
  });

  const { fields } = useFieldArray({
    name: "items",
    control,
  });

  const onSubmit = async (data: z.infer<typeof receivePOSchema>) => {
    // Filter out items where receiveQty is 0 or less
    const validData = {
      ...data,
      items: data.items.filter(item => item.receiveQty > 0)
    };

    if (validData.items.length === 0) {
      toast.error("Please enter a receive quantity greater than 0 for at least one item.");
      return;
    }

    setIsLoading(true);
    try {
      await receivePurchaseOrder(poId, validData);

      
      toast.success("Goods received successfully");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to receive goods");
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingItems.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        All items on this purchase order have been fully received.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="locationId">Destination Location *</Label>
        <select
          id="locationId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("locationId")}
        >
          <option value="">Select a location to receive into...</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.warehouse.name} - {loc.name}
            </option>
          ))}
        </select>
        {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>Items to Receive</Label>
        
        {errors.items?.root && (
          <p className="text-sm text-destructive">{errors.items.root.message}</p>
        )}

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium text-right w-24">Ordered</th>
                <th className="px-4 py-3 font-medium text-right w-24">Received</th>
                <th className="px-4 py-3 font-medium text-right w-24">Pending</th>
                <th className="px-4 py-3 font-medium w-32">Receive Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-card">
              {fields.map((field, index) => {
                const poItem = pendingItems.find(p => p.id === field.id);
                if (!poItem) return null;
                const pending = poItem.quantity - poItem.receivedQty;

                return (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{poItem.product.name}</div>
                      <div className="text-xs text-muted-foreground">{poItem.product.sku}</div>
                      {/* Hidden field for item ID */}
                      <input type="hidden" {...register(`items.${index}.id`)} />
                    </td>
                    <td className="px-4 py-3 text-right">{poItem.quantity}</td>
                    <td className="px-4 py-3 text-right">{poItem.receivedQty}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                      {pending}
                    </td>
                    <td className="px-4 py-2">
                      <Input 
                        type="number" onFocus={(e) => e.target.select()} 
                        min="0" 
                        max={pending}
                        className="h-9" 
                        {...register(`items.${index}.receiveQty`)} 
                      />
                      {errors.items?.[index]?.receiveQty && (
                        <p className="text-xs text-destructive mt-1">{errors.items[index]?.receiveQty?.message}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Receipt Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Condition of goods, delivery person, etc." 
          {...register("notes")} 
          rows={2}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm Receipt"}
        </Button>
      </div>
    </form>
  );
}

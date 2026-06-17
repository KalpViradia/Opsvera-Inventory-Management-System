/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shipSOSchema } from "@/validations/sales";
import { shipSalesOrder } from "@/actions/sales";

interface ShipDialogProps {
  soId: string;
  items: {
    id: string;
    productId: string;
    quantity: number;
    product: { name: string; sku: string };
  }[];
  locations: { id: string; name: string; warehouse: { name: string } }[];
}

export function ShipDialog({ soId, items, locations }: ShipDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof shipSOSchema>>({
    resolver: zodResolver(shipSOSchema) as any,
    defaultValues: {
      locationId: "",
      notes: "",
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity, // Default to ship all remaining (since we don't have partial shipment yet)
      })),
    },
  });

  const onSubmit = async (data: z.infer<typeof shipSOSchema>) => {
    setIsLoading(true);
    try {
      await shipSalesOrder(soId, data);

      
      toast.success("Sales order shipped and invoice generated");
      // The dialog will close automatically if we handle state, but here we can just refresh
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="locationId">Source Location *</Label>
        <select
          id="locationId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("locationId")}
        >
          <option value="" className="bg-background text-foreground">Select location to pick from...</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id} className="bg-background text-foreground">
              {loc.warehouse.name} - {loc.name}
            </option>
          ))}
        </select>
        {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium text-right w-24">Order Qty</th>
              <th className="px-4 py-2 font-medium text-right w-32">Ship Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="px-4 py-2">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                  <input type="hidden" {...register(`items.${index}.id`)} />
                  <input type="hidden" {...register(`items.${index}.productId`)} />
                </td>
                <td className="px-4 py-2 text-right">{item.quantity}</td>
                <td className="px-4 py-2">
                  <Input 
                    type="number" onFocus={(e) => e.target.select()} 
                    min="1" 
                    max={item.quantity}
                    className="h-8 text-right" 
                    {...register(`items.${index}.quantity`)} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Shipping Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Courier details, tracking number, etc." 
          {...register("notes")} 
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm Shipment"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Customer, Product } from "@prisma/client";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Trash2, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSOSchema } from "@/validations/sales";
import { createSalesOrder } from "@/actions/sales";
import { getProductPriceForCustomer } from "@/actions/price-lists";

interface SOFormProps {
  customers: Customer[];
  products: Product[];
}

export function SOForm({ customers, products }: SOFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof createSOSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSOSchema) as any,
    defaultValues: {
      customerId: "",
      soNumber: "",
      status: "DRAFT",
      notes: "",
      discount: 0,
      currency: "USD",
      exchangeRate: 1,
      items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control,
  });

  const watchItems = watch("items");
  const overallDiscount = watch("discount") || 0;
  const watchExchangeRate = watch("exchangeRate") || 1;
  const selectedCurrency = watch("currency") || "USD";
  
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CNY: "¥",
  };
  const symbol = currencySymbols[selectedCurrency] || "$";
  
  // Calculate totals
  const subtotal = watchItems.reduce((acc, item) => {
    const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
    return acc + (itemTotal > 0 ? itemTotal : 0);
  }, 0);
  
  const totalTax = watchItems.reduce((acc, item) => {
    const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
    const itemTax = (itemTotal > 0 ? itemTotal : 0) * ((item.taxRate || 0) / 100);
    return acc + itemTax;
  }, 0);
  
  let grandTotal = subtotal + totalTax - overallDiscount;
  if (grandTotal < 0) grandTotal = 0;

  const onSubmit = async (data: z.infer<typeof createSOSchema>) => {
    setIsLoading(true);
    try {
      const result = await createSalesOrder(data);

      
      toast.success("Sales order created successfully");
      router.push(`/sales/${result.data?.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer *</Label>
          <select
            id="customerId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("customerId")}
          >
            <option value="" className="bg-background text-foreground">Select a customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id} className="bg-background text-foreground">
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="soNumber">SO Number</Label>
          <Input 
            id="soNumber" 
            placeholder="Leave blank to auto-generate" 
            {...register("soNumber")} 
          />
        </div>
      </div>

      {/* Currency Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg border border-dashed bg-muted/20">
        <div className="flex items-center gap-3 md:col-span-3">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Currency Settings</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("currency")}
          >
            <option value="USD" className="bg-background text-foreground">USD — US Dollar</option>
            <option value="EUR" className="bg-background text-foreground">EUR — Euro</option>
            <option value="GBP" className="bg-background text-foreground">GBP — British Pound</option>
            <option value="INR" className="bg-background text-foreground">INR — Indian Rupee</option>
            <option value="JPY" className="bg-background text-foreground">JPY — Japanese Yen</option>
            <option value="CAD" className="bg-background text-foreground">CAD — Canadian Dollar</option>
            <option value="AUD" className="bg-background text-foreground">AUD — Australian Dollar</option>
            <option value="CNY" className="bg-background text-foreground">CNY — Chinese Yuan</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="exchangeRate">Exchange Rate (to base)</Label>
          <Input 
            id="exchangeRate" 
            type="number" onFocus={(e) => e.target.select()}
            step="0.000001"
            min="0.000001"
            placeholder="1.000000"
            {...register("exchangeRate")} 
          />
          <p className="text-xs text-muted-foreground">Rate relative to your company&apos;s base currency</p>
        </div>
        <div className="space-y-2 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground">Base Currency Equivalent</p>
          <p className="text-lg font-semibold">{symbol}{(grandTotal * (watchExchangeRate || 1)).toFixed(2)}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Line Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>

        {errors.items?.root && (
          <p className="text-sm text-destructive">{errors.items.root.message}</p>
        )}

        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product *</th>
                <th className="px-4 py-3 font-medium w-24">Qty *</th>
                <th className="px-4 py-3 font-medium w-32">Unit Price *</th>
                <th className="px-4 py-3 font-medium w-24">Disc. ({symbol})</th>
                <th className="px-4 py-3 font-medium w-24">Tax %</th>
                <th className="px-4 py-3 font-medium text-right w-32">Line Total</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.map((field, index) => {
                const itemQty = watchItems[index]?.quantity || 0;
                const itemPrice = watchItems[index]?.unitPrice || 0;
                const itemDiscount = watchItems[index]?.discount || 0;
                const itemTaxRate = watchItems[index]?.taxRate || 0;
                
                let lineTotal = (itemQty * itemPrice) - itemDiscount;
                if (lineTotal < 0) lineTotal = 0;
                lineTotal += lineTotal * (itemTaxRate / 100);

                return (
                  <tr key={field.id} className="bg-card">
                    <td className="px-4 py-3">
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...register(`items.${index}.productId`)}
                        onChange={async (e) => {
                          register(`items.${index}.productId`).onChange(e);
                          const productId = e.target.value;
                          // eslint-disable-next-line react-hooks/incompatible-library
                          const customerId = watch("customerId");
                          
                          if (productId && customerId) {
                            try {
                              const qty = watchItems[index]?.quantity || 1;
                              const price = await getProductPriceForCustomer(customerId, productId, qty);
                              setValue(`items.${index}.unitPrice`, price);
                            } catch (error) {
                              console.error("Failed to fetch custom price", error);
                            }
                          } else {
                             const product = products.find(p => p.id === productId);
                             if (product && product.averageCost) {
                               setValue(`items.${index}.unitPrice`, Number(product.averageCost));
                             }
                          }
                        }}
                      >
                        <option value="" className="bg-background text-foreground">Select product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id} className="bg-background text-foreground">
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.productId && (
                        <p className="text-xs text-destructive mt-1">{errors.items[index]?.productId?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" onFocus={(e) => e.target.select()} 
                        min="1" 
                        className="h-9" 
                        {...register(`items.${index}.quantity`)}
                        onChange={async (e) => {
                          register(`items.${index}.quantity`).onChange(e);
                          const qty = parseInt(e.target.value) || 1;
                          const productId = watchItems[index]?.productId;
                          const customerId = watch("customerId");
                          
                          if (productId && customerId) {
                            try {
                              const price = await getProductPriceForCustomer(customerId, productId, qty);
                              setValue(`items.${index}.unitPrice`, price);
                            } catch (error) {
                              console.error("Failed to fetch volume price", error);
                            }
                          }
                        }}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-destructive mt-1">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" onFocus={(e) => e.target.select()} 
                        step="0.01" 
                        min="0" 
                        className="h-9" 
                        {...register(`items.${index}.unitPrice`)} 
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="text-xs text-destructive mt-1">{errors.items[index]?.unitPrice?.message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" onFocus={(e) => e.target.select()} 
                        step="0.01" 
                        min="0" 
                        className="h-9" 
                        {...register(`items.${index}.discount`)} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" onFocus={(e) => e.target.select()} 
                        step="0.01" 
                        min="0" 
                        max="100" 
                        className="h-9" 
                        {...register(`items.${index}.taxRate`)} 
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {symbol}{lineTotal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{symbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tax:</span>
              <span>{symbol}{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <Label htmlFor="discount" className="text-muted-foreground">Overall Discount:</Label>
              <Input 
                id="discount"
                type="number" onFocus={(e) => e.target.select()}
                step="0.01"
                min="0"
                className="h-8 w-24 text-right"
                {...register("discount")}
              />
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-3">
              <span>Grand Total:</span>
              <span>{symbol}{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Terms, delivery instructions, etc." 
          {...register("notes")} 
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Sales Order"}
        </Button>
      </div>
    </form>
  );
}

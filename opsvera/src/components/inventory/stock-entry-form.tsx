"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StockEntryType } from "@prisma/client";
import { toast } from "sonner";
import { Loader2, ScanBarcode } from "lucide-react";
import { useRouter } from "next/navigation";

import { createStockEntrySchema, type CreateStockEntryInput } from "@/validations/inventory";
import { createStockEntry } from "@/actions/inventory";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { CameraScanner } from "@/components/shared/camera-scanner";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Product = { id: string; name: string; sku: string; barcode?: string | null; isBatchTracked?: boolean };
type Location = { id: string; name: string };
type Warehouse = { id: string; name: string; locations: Location[] };

interface StockEntryFormProps {
  products: Product[];
  warehouses: Warehouse[];
  onSuccess?: () => void;
}

export function StockEntryForm({ products, warehouses, onSuccess }: StockEntryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const form = useForm<CreateStockEntryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createStockEntrySchema) as any,
    defaultValues: {
      type: StockEntryType.RECEIPT,
      productId: "",
      quantity: 1,
      notes: "",
      serialNumbers: [],
    },
  });

  // Barcode Scanner Integration
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      // Try to match by barcode field first, then by SKU
      const match =
        products.find((p) => p.barcode === barcode) ||
        products.find((p) => p.sku === barcode);

      if (match) {
        form.setValue("productId", match.id);
        toast.success(`Scanned: ${match.name} (${match.sku})`, {
          icon: "📦",
        });
      } else {
        toast.error(`No product found for barcode: ${barcode}`, {
          description: "Ensure the barcode is registered in the product catalog.",
        });
      }
    },
    [products, form]
  );

  const { lastScanned } = useBarcodeScanner(handleBarcodeScan, {
    enabled: scannerActive,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const entryType = form.watch("type");
  const selectedProductId = form.watch("productId");
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const showFromLocation = ["DELIVERY", "TRANSFER", "ADJUSTMENT", "SCRAP"].includes(entryType);
  const showToLocation = ["RECEIPT", "TRANSFER", "ADJUSTMENT"].includes(entryType);

  async function onSubmit(data: CreateStockEntryInput) {
    setIsSubmitting(true);
    try {
      await createStockEntry(data);
      toast.success("Stock entry recorded successfully");
      form.reset();
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error((error as Error).message || "Failed to record stock entry");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Location options grouped by warehouse
  const LocationOptions = () => {
    const warehousesWithLocations = warehouses.filter((w) => w.locations.length > 0);
    
    if (warehousesWithLocations.length === 0) {
      return (
        <SelectItem value="empty" disabled>
          No locations available
        </SelectItem>
      );
    }

    return (
      <>
        {warehousesWithLocations.map((warehouse) => (
          <SelectGroup key={warehouse.id}>
            <SelectLabel>{warehouse.name}</SelectLabel>
            {warehouse.locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Barcode Scanner Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${scannerActive ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"} transition-colors`}>
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Barcode Scanner {scannerActive ? "Active" : "Inactive"}
              </p>
              <p className="text-xs text-muted-foreground">
                {scannerActive
                  ? lastScanned
                    ? `Last scanned: ${lastScanned}`
                    : "Waiting for scan input..."
                  : "Enable to auto-select products by scanning barcodes"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCamera(true)}
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button
              type="button"
              variant={scannerActive ? "default" : "outline"}
              size="sm"
              onClick={() => setScannerActive(!scannerActive)}
              className={scannerActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              {scannerActive ? "Disable" : "Hardware"}
            </Button>
          </div>
        </div>

        {showCamera && (
          <CameraScanner
            onScan={(decoded) => {
              handleBarcodeScan(decoded);
              setShowCamera(false);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RECEIPT">Receipt (+)</SelectItem>
                    <SelectItem value="DELIVERY">Delivery (-)</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="SCRAP">Scrap (-)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input 
                  type="number" onFocus={(e) => e.target.select()} 
                  min={1} 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {showFromLocation && (
            <FormField
              control={form.control}
              name="fromLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Location</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <LocationOptions />
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {showToLocation && (
            <FormField
              control={form.control}
              name="toLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Location</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <LocationOptions />
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {selectedProduct?.isBatchTracked && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BATCH-2023-01" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Reason for adjustment, PO reference, etc." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Record Entry"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { createProductSchema, type CreateProductInput } from "@/validations/product";
import { createProduct, updateProduct } from "@/actions/products";
import { saveCustomFieldValues } from "@/actions/custom-fields";
import type { ProductCategory, ProductUnit, ProductWithRelations } from "@/types/product";
import type { CustomField } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ProductFormProps {
  initialData?: ProductWithRelations & { customFieldValues?: any[] };
  categories: ProductCategory[];
  units: ProductUnit[];
  customFields?: CustomField[];
  suppliers?: any[]; // Using any to avoid importing Supplier type for now
}


import { DynamicFieldRenderer } from "@/components/ui/dynamic-field-renderer";

export function ProductForm({ initialData, categories, units, customFields = [], suppliers = [] }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;
  
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    if (initialData?.customFieldValues) {
      initialData.customFieldValues.forEach((cfv) => {
        vals[cfv.fieldId] = cfv.value;
      });
    }
    return vals;
  });
  const [isDynamicValid, setIsDynamicValid] = useState(true);

  const defaultValues = {
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    unitId: initialData?.unitId || "",
    status: (initialData?.status as "DRAFT" | "ACTIVE" | "ARCHIVED") || "DRAFT",
    imageUrl: initialData?.imageUrl || "",
    minStockLevel: initialData?.minStockLevel || 0,
    reorderQuantity: (initialData as any)?.reorderQuantity || undefined,
    preferredSupplierId: (initialData as any)?.preferredSupplierId || undefined,
    weight: (initialData as any)?.weight || undefined,
    length: (initialData as any)?.length || undefined,
    width: (initialData as any)?.width || undefined,
    height: (initialData as any)?.height || undefined,
    isBundle: (initialData as any)?.isBundle || false,
    isBatchTracked: initialData?.isBatchTracked || false,
    variants: initialData?.variants?.length 
      ? initialData.variants.map((v) => ({
          name: v.name,
          sku: v.sku || undefined,
          price: Number(v.price),
          cost: v.cost ? Number(v.cost) : undefined,
        }))
      : [],
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    name: "variants",
    control,
  });

  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: "", sku: "", price: "", cost: "" });

  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.price) {
      toast.error("Name and Price are required for a variant.");
      return;
    }
    append({
      name: newVariant.name,
      sku: newVariant.sku || undefined,
      price: Number(newVariant.price),
      cost: newVariant.cost ? Number(newVariant.cost) : undefined,
    });
    setNewVariant({ name: "", sku: "", price: "", cost: "" });
    setIsAddVariantOpen(false);
  };

  // Watch for select fields since we can't easily register standard selects
  // Watch for select fields since we can't easily register standard selects

  const onSubmit = async (data: CreateProductInput) => {
    if (!isDynamicValid) {
      toast.error("Please fill all required custom fields");
      return;
    }

    setIsLoading(true);
    try {
      let productId = initialData?.id;
      
      if (isEditing) {
        await updateProduct({ ...data, id: initialData.id });
        toast.success("Product updated successfully");
      } else {
        const res = await createProduct(data);
        productId = res.id;
        toast.success("Product created successfully");
      }

      if (productId && Object.keys(dynamicValues).length > 0) {
        const valuesArr = Object.entries(dynamicValues).map(([fieldId, value]) => ({ fieldId, value }));
        await saveCustomFieldValues({ entityId: productId, values: valuesArr });
      }
      router.push("/products");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Update product details and variants."
              : "Create a new product with multiple variants in your catalog."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product core details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Premium Widget"
                      {...register("name")}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Describe the product..."
                      {...register("description")}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isBundle" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      {...register("isBundle")}
                    />
                    <Label htmlFor="isBundle" className="font-normal cursor-pointer">
                      This product is a Bundle (Kit) made of other products
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isBatchTracked" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      {...register("isBatchTracked")}
                    />
                    <Label htmlFor="isBatchTracked" className="font-normal cursor-pointer">
                      Track specific batches and expiry dates for this product
                    </Label>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.png"
                      {...register("imageUrl")}
                    />
                    {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Industry specific details</CardDescription>
              </CardHeader>
              <CardContent>
                {customFields.length > 0 ? (
                  <DynamicFieldRenderer
                    fields={customFields}
                    initialValues={dynamicValues}
                    onChange={(values, valid) => {
                      setDynamicValues(values);
                      setIsDynamicValid(valid);
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No custom fields configured.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variants</CardTitle>
                <CardDescription>Different versions like sizes or colors.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">
                      No variants added yet. Click &quot;Add Variant&quot; to create one.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {fields.map((field, index) => {
                        const variant = field as any;
                        return (
                        <div key={field.id} className="p-4 border rounded-lg bg-card flex items-center justify-between">
                          {/* Hidden inputs to preserve form data */}
                          <input type="hidden" {...register(`variants.${index}.name` as const)} defaultValue={variant.name} />
                          <input type="hidden" {...register(`variants.${index}.sku` as const)} defaultValue={variant.sku || ""} />
                          <input type="hidden" {...register(`variants.${index}.price` as const, { valueAsNumber: true })} defaultValue={variant.price} />
                          <input type="hidden" {...register(`variants.${index}.cost` as const, { valueAsNumber: true })} defaultValue={variant.cost || ""} />
                          
                          <div>
                            <h4 className="font-medium text-sm">{variant.name}</h4>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                              <span>Price: ${Number(variant.price).toFixed(2)}</span>
                              {variant.cost && <span>Cost: ${Number(variant.cost).toFixed(2)}</span>}
                              {variant.sku && <span>SKU: {variant.sku}</span>}
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Variant</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this variant? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => remove(index)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )})}
                    </div>
                  )}
                  
                  <Dialog open={isAddVariantOpen} onOpenChange={setIsAddVariantOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Variant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Variant</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new product variant.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="v-name">Variant Name *</Label>
                          <Input
                            id="v-name"
                            placeholder="e.g. Red / Large"
                            value={newVariant.name}
                            onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="v-sku">Variant SKU</Label>
                          <Input
                            id="v-sku"
                            placeholder="Optional (auto-generated if blank)"
                            value={newVariant.sku}
                            onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="v-price">Price *</Label>
                            <Input
                              id="v-price"
                              type="number" onFocus={(e) => e.target.select()}
                              step="0.01"
                              placeholder="0.00"
                              value={newVariant.price}
                              onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="v-cost">Cost</Label>
                            <Input
                              id="v-cost"
                              type="number" onFocus={(e) => e.target.select()}
                              step="0.01"
                              placeholder="0.00"
                              value={newVariant.cost}
                              onChange={(e) => setNewVariant({ ...newVariant, cost: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddVariantOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleAddVariant}>Add Variant</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {errors.variants && !Array.isArray(errors.variants) && (
                    <p className="text-sm text-destructive">{errors.variants.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sku">Master SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="e.g. WIDGET-PRO"
                      {...register("sku")}
                    />
                    {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...register("imageUrl")}
                    />
                    {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Controller
                      control={control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>No categories available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Unit of Measure *</Label>
                    <Controller
                      control={control}
                      name="unitId"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={errors.unitId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.length > 0 ? (
                              units.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>No units available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.unitId && <p className="text-sm text-destructive">{errors.unitId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                    <Input
                      id="minStockLevel"
                      type="number" onFocus={(e) => e.target.select()}
                      min="0"
                      placeholder="0"
                      {...register("minStockLevel")}
                    />
                    {errors.minStockLevel && <p className="text-sm text-destructive">{errors.minStockLevel.message}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Replenishment Rules</h4>
                    <p className="text-xs text-muted-foreground">Auto-generate draft POs when stock falls below minimum.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                    <Input
                      id="reorderQuantity"
                      type="number" onFocus={(e) => e.target.select()}
                      min="0"
                      placeholder="e.g. 100"
                      {...register("reorderQuantity")}
                    />
                    {errors.reorderQuantity && <p className="text-sm text-destructive">{errors.reorderQuantity.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Supplier</Label>
                    <Controller
                      control={control}
                      name="preferredSupplierId"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                        >
                          <SelectTrigger className={errors.preferredSupplierId ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.preferredSupplierId && <p className="text-sm text-destructive">{errors.preferredSupplierId.message}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Logistics & Dimensions</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input id="weight" type="number" onFocus={(e) => e.target.select()} step="0.001" placeholder="0.000" {...register("weight")} />
                      {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="length">Length (cm)</Label>
                      <Input id="length" type="number" onFocus={(e) => e.target.select()} step="0.01" placeholder="0.00" {...register("length")} />
                      {errors.length && <p className="text-sm text-destructive">{errors.length.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input id="width" type="number" onFocus={(e) => e.target.select()} step="0.01" placeholder="0.00" {...register("width")} />
                      {errors.width && <p className="text-sm text-destructive">{errors.width.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input id="height" type="number" onFocus={(e) => e.target.select()} step="0.01" placeholder="0.00" {...register("height")} />
                      {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

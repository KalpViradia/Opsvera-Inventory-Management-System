/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Supplier, CustomField } from "@prisma/client";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { createSupplierSchema } from "@/validations/supplier";
import { createSupplier, updateSupplier } from "@/actions/suppliers";
import { saveCustomFieldValues } from "@/actions/custom-fields";
import { DynamicFieldRenderer } from "@/components/ui/dynamic-field-renderer";

interface SupplierFormProps {
  initialData?: Supplier & { customFieldValues?: any[] };
  customFields?: CustomField[];
  onSuccess?: () => void;
}

export function SupplierForm({ initialData, customFields = [], onSuccess }: SupplierFormProps) {
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof createSupplierSchema>>({
    resolver: zodResolver(createSupplierSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      paymentTerms: initialData?.paymentTerms || undefined,
      taxId: initialData?.taxId || "",
      bankDetails: initialData?.bankDetails || "",
      rating: initialData?.rating || undefined,
      isActive: initialData ? initialData.isActive : true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = async (data: z.infer<typeof createSupplierSchema>) => {
    if (!isDynamicValid) {
      toast.error("Please fill all required custom fields");
      return;
    }

    setIsLoading(true);
    try {
      let supplierId = initialData?.id;
      
      if (isEditing && initialData) {
        await updateSupplier(initialData.id, data);
        toast.success("Supplier updated successfully");
      } else {
        const res = await createSupplier(data);
        supplierId = res.data?.id;
        toast.success("Supplier created successfully");
      }
      
      if (supplierId && Object.keys(dynamicValues).length > 0) {
        const valuesArr = Object.entries(dynamicValues).map(([fieldId, value]) => ({ fieldId, value }));
        await saveCustomFieldValues({ entityId: supplierId, values: valuesArr });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Supplier Name *</Label>
        <Input 
          id="name" 
          placeholder="e.g. Acme Corp" 
          {...register("name")} 
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email"
            placeholder="e.g. contact@acme.com" 
            {...register("email")} 
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            type="tel"
            maxLength={10}
            placeholder="e.g. 1234567890" 
            {...register("phone", {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
              }
            })} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input 
          id="address" 
          placeholder="Full address details" 
          {...register("address")} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
          <Input 
            id="paymentTerms" 
            type="number" onFocus={(e) => e.target.select()}
            placeholder="e.g. 30" 
            {...register("paymentTerms")} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID / VAT Number</Label>
          <Input 
            id="taxId" 
            placeholder="e.g. US-123456789" 
            {...register("taxId")} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankDetails">Bank Details</Label>
        <Textarea 
          id="bankDetails" 
          placeholder="Bank Name, Account Number, SWIFT/Routing" 
          {...register("bankDetails")} 
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rating">Rating (1-5)</Label>
        <Input 
          id="rating" 
          type="number" onFocus={(e) => e.target.select()}
          min="1"
          max="5"
          placeholder="e.g. 5" 
          {...register("rating")} 
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="isActive" 
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
        />
        <Label htmlFor="isActive" className="font-normal cursor-pointer">
          Supplier is active
        </Label>
      </div>
      
      {customFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium leading-none">Additional Information</h3>
          <DynamicFieldRenderer
            fields={customFields}
            initialValues={dynamicValues}
            onChange={(values, valid) => {
              setDynamicValues(values);
              setIsDynamicValid(valid);
            }}
          />
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isEditing ? "Update Supplier" : "Create Supplier"}
        </Button>
      </div>
    </form>
  );
}

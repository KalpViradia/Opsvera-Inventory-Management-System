"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Customer, CustomField } from "@prisma/client";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomerSchema } from "@/validations/customer";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { saveCustomFieldValues } from "@/actions/custom-fields";
import { DynamicFieldRenderer } from "@/components/ui/dynamic-field-renderer";

interface CustomerFormProps {
  initialData?: Customer & { customFieldValues?: { fieldId: string; value: string }[] };
  customFields?: CustomField[];
  priceLists?: { id: string; name: string }[];
  onSuccess?: () => void;
}

export function CustomerForm({ initialData, customFields = [], priceLists = [], onSuccess }: CustomerFormProps) {
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
  } = useForm<z.infer<typeof createCustomerSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCustomerSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      creditLimit: initialData?.creditLimit ? Number(initialData.creditLimit) : undefined,
      paymentTerms: initialData?.paymentTerms || undefined,
      taxId: initialData?.taxId || "",
      priceListId: initialData?.priceListId || "",
      isActive: initialData ? initialData.isActive : true,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isActive = watch("isActive");

  const onSubmit = async (data: z.infer<typeof createCustomerSchema>) => {
    if (!isDynamicValid) {
      toast.error("Please fill all required custom fields");
      return;
    }

    setIsLoading(true);
    try {
      let customerId = initialData?.id;

      if (isEditing && initialData) {
        await updateCustomer(initialData.id, data);
        toast.success("Customer updated successfully");
      } else {
        const res = await createCustomer(data);
        customerId = res.data?.id;
        toast.success("Customer created successfully");
      }
      
      if (customerId && Object.keys(dynamicValues).length > 0) {
        const valuesArr = Object.entries(dynamicValues).map(([fieldId, value]) => ({ fieldId, value }));
        await saveCustomFieldValues({ entityId: customerId, values: valuesArr });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/customers");
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
        <Label htmlFor="name">Customer Name *</Label>
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
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input 
          id="address" 
          placeholder="Full address details" 
          {...register("address")} 
        />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit ($)</Label>
          <Input 
            id="creditLimit" 
            type="number"
            step="0.01"
            placeholder="e.g. 50000" 
            {...register("creditLimit")} 
            onFocus={(e) => e.target.select()}
          />
          {errors.creditLimit && <p className="text-sm text-destructive">{errors.creditLimit.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
          <Input 
            id="paymentTerms" 
            type="number"
            placeholder="e.g. 30" 
            {...register("paymentTerms")} 
          />
          {errors.paymentTerms && <p className="text-sm text-destructive">{errors.paymentTerms.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID / VAT Number</Label>
          <Input 
            id="taxId" 
            placeholder="e.g. US-123456789" 
            {...register("taxId")} 
          />
          {errors.taxId && <p className="text-sm text-destructive">{errors.taxId.message}</p>}
        </div>

        {priceLists.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="priceListId">Price List</Label>
            <Select 
              value={watch("priceListId") || "none"} 
              onValueChange={(val) => setValue("priceListId", val === "none" ? undefined : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standard Pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Standard Pricing</SelectItem>
                {priceLists.map((pl) => (
                  <SelectItem key={pl.id} value={pl.id}>
                    {pl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="isActive" 
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
        />
        <Label htmlFor="isActive" className="font-normal cursor-pointer">
          Customer is active
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

      <div className="pt-4 flex justify-end gap-2 border-t mt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isEditing ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}

/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Warehouse } from "@prisma/client";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createWarehouseSchema } from "@/validations/warehouse";
import { createWarehouse, updateWarehouse } from "@/actions/warehouses";

interface WarehouseFormProps {
  initialData?: Warehouse;
  onSuccess?: () => void;
}

export function WarehouseForm({ initialData, onSuccess }: WarehouseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof createWarehouseSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createWarehouseSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      contactPerson: initialData?.contactPerson || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      isActive: initialData ? initialData.isActive : true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = async (data: z.infer<typeof createWarehouseSchema>) => {
    setIsLoading(true);
    try {
      if (isEditing && initialData) {
        await updateWarehouse(initialData.id, data);
        toast.success("Warehouse updated successfully");
      } else {
        await createWarehouse(data);
        toast.success("Warehouse created successfully");
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
        <Label htmlFor="name">Warehouse Name *</Label>
        <Input 
          id="name" 
          placeholder="e.g. Main Distribution Center" 
          {...register("name")} 
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input 
            id="contactPerson" 
            placeholder="e.g. John Doe" 
            {...register("contactPerson")} 
          />
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
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          type="email"
          placeholder="e.g. warehouse@example.com" 
          {...register("email")} 
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="isActive" 
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
        />
        <Label htmlFor="isActive" className="font-normal cursor-pointer">
          Warehouse is active and can receive stock
        </Label>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isEditing ? "Update Warehouse" : "Create Warehouse"}
        </Button>
      </div>
    </form>
  );
}

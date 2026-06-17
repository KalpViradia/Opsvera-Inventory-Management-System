/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Location } from "@prisma/client";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createLocationSchema } from "@/validations/warehouse";
import { createLocation, updateLocation } from "@/actions/locations";

interface LocationFormProps {
  warehouseId: string;
  initialData?: Location;
  parentLocationId?: string | null;
  onSuccess?: () => void;
}

export function LocationForm({ warehouseId, initialData, parentLocationId, onSuccess }: LocationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof createLocationSchema>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createLocationSchema) as any,
    defaultValues: {
      warehouseId,
      name: initialData?.name || "",
      description: initialData?.description || "",
      parentLocationId: initialData?.parentLocationId || parentLocationId || null,
      isActive: initialData ? initialData.isActive : true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = async (data: z.infer<typeof createLocationSchema>) => {
    setIsLoading(true);
    try {
      if (isEditing && initialData) {
        await updateLocation(initialData.id, data);
        toast.success("Location updated successfully");
      } else {
        await createLocation(data);
        toast.success("Location created successfully");
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
        <Label htmlFor="name">Location Name *</Label>
        <Input 
          id="name" 
          placeholder="e.g. Zone A, Rack 12" 
          {...register("name")} 
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description" 
          placeholder="Optional details" 
          {...register("description")} 
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="isActive" 
          checked={isActive}
          onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
        />
        <Label htmlFor="isActive" className="font-normal cursor-pointer">
          Location is active
        </Label>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isEditing ? "Update Location" : "Create Location"}
        </Button>
      </div>
    </form>
  );
}

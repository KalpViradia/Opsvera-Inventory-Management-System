"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2 } from "lucide-react";
import { LocationForm } from "./location-form";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LocationDialog({ warehouseId, parentLocationId, initialData }: { warehouseId: string, parentLocationId?: string | null, initialData?: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={parentLocationId ? "sm" : initialData ? "icon" : "default"} variant={parentLocationId || initialData ? "ghost" : "default"} title={initialData ? "Edit Location" : parentLocationId ? "Add Sub-location" : "Add Main Zone"}>
          {initialData ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className={parentLocationId ? "h-3.5 w-3.5" : "mr-2 h-4 w-4"} />}
          {!initialData && !parentLocationId && "Add Location"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Location" : "Add New Location"}</DialogTitle>
        </DialogHeader>
        <LocationForm 
          warehouseId={warehouseId} 
          parentLocationId={parentLocationId} 
          initialData={initialData}
          onSuccess={() => { setOpen(false); router.refresh(); }} 
        />
      </DialogContent>
    </Dialog>
  );
}

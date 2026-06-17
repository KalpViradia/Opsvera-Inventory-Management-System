"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { WarehouseForm } from "./warehouse-form";
import { useRouter } from "next/navigation";

export function WarehouseDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Warehouse</DialogTitle>
        </DialogHeader>
        <WarehouseForm onSuccess={() => { 
          setOpen(false); 
          router.refresh(); 
        }} />
      </DialogContent>
    </Dialog>
  );
}

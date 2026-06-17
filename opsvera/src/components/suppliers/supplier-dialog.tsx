"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { SupplierForm } from "./supplier-form";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SupplierDialog({ customFields = [] }: { customFields?: any[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <SupplierForm customFields={customFields} onSuccess={() => { setOpen(false); router.refresh(); }} />
      </DialogContent>
    </Dialog>
  );
}

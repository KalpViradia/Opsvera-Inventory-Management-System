"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CustomerForm } from "./customer-form";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomerDialog({ customFields, priceLists }: { customFields: any[], priceLists: any[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm 
          customFields={customFields} 
          priceLists={priceLists} 
          onSuccess={() => { 
            setOpen(false); 
            router.refresh(); 
          }} 
        />
      </DialogContent>
    </Dialog>
  );
}

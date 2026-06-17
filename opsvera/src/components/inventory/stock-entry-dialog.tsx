"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { StockEntryForm } from "./stock-entry-form";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StockEntryDialog({ products, warehouses }: { products: any[], warehouses: any[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        <StockEntryForm 
          products={products} 
          warehouses={warehouses} 
          onSuccess={() => { setOpen(false); router.refresh(); }} 
        />
      </DialogContent>
    </Dialog>
  );
}

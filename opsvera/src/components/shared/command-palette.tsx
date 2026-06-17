"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, FileText, Package, ShoppingCart, Truck, Activity } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push("/products/new"))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Create New Product</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/sales/new"))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Create Sales Order</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/purchases/new"))}>
            <Truck className="mr-2 h-4 w-4" />
            <span>Create Purchase Order</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/products"))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Products & Catalog</span>
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/inventory/stock"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Inventory & Stock Entries</span>
            <CommandShortcut>G I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/sales"))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Sales & Quotations</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/purchases"))}>
            <Truck className="mr-2 h-4 w-4" />
            <span>Procurement (Purchases)</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>General Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings/users"))}>
            <User className="mr-2 h-4 w-4" />
            <span>Team & Roles</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

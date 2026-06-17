"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Users,
  Box,
  LayoutDashboard,
  Settings,
  FileText,
  Truck,
  Building2,
  ShieldCheck,
  FileSearch,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
    <>
      <div 
        className="relative hidden lg:flex items-center group max-w-sm w-full ml-auto cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="absolute left-3 text-muted-foreground transition-colors">
          <FileSearch className="w-4 h-4" />
        </div>
        <div className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-4 text-sm flex items-center text-muted-foreground hover:bg-muted transition-all">
          Search...
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="General">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Inventory & Products">
            <CommandItem onSelect={() => runCommand(() => router.push("/products"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Products Catalog</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/inventory"))}>
              <Box className="mr-2 h-4 w-4" />
              <span>Inventory & Stock</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/warehouses"))}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Warehouses</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Purchasing & Sales">
            <CommandItem onSelect={() => runCommand(() => router.push("/purchases"))}>
              <Truck className="mr-2 h-4 w-4" />
              <span>Purchase Orders</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/sales"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Sales Orders</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/suppliers"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Suppliers & Vendors</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push("/settings/general"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>General Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings/users"))}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Users & Roles</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings/audit"))}>
              <FileSearch className="mr-2 h-4 w-4" />
              <span>Audit Log</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Box,
  Warehouse,
  ShoppingCart,
  Truck,
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  SlidersHorizontal,
  FileSearch,
  Package,
  Layers,
  Factory,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/shared/branding";
import { useSession } from "@/lib/auth-client";
import { checkPermission, checkMinimumRole } from "@/lib/rbac-client";
import type { Module, Role } from "@/constants/roles";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  requiredModule?: string;
  minRole?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", requiredModule: "dashboard" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: Box, label: "Products", href: "/products", requiredModule: "products" },
      { icon: Warehouse, label: "Warehouses", href: "/warehouses", requiredModule: "inventory" },
      { icon: Package, label: "Inventory", href: "/inventory", requiredModule: "inventory" },
      { icon: Truck, label: "Purchases", href: "/purchases", requiredModule: "purchases" },
      { icon: UserCheck, label: "Suppliers", href: "/suppliers", requiredModule: "suppliers" },
      { icon: ShoppingCart, label: "Sales", href: "/sales", requiredModule: "sales" },
      { icon: Package, label: "Shipments", href: "/sales/shipments", requiredModule: "sales" },
      { icon: Users, label: "Customers", href: "/customers", requiredModule: "customers" },
    ],
  },
  {
    title: "Manufacturing",
    items: [
      { icon: Layers, label: "Bill of Materials", href: "/manufacturing/boms", requiredModule: "inventory" },
      { icon: Factory, label: "Production Orders", href: "/manufacturing/production", requiredModule: "inventory" },
    ],
  },
  {
    title: "Finance",
    items: [
      { icon: BookOpen, label: "Accounting", href: "/accounting", requiredModule: "accounting" },
      { icon: BarChart3, label: "Reports", href: "/reports", requiredModule: "reports" },
    ],
  },
];

const settingsItems: NavItem[] = [
  { icon: Settings, label: "General", href: "/settings/general", requiredModule: "settings" },
  { icon: Shield, label: "Users & Roles", href: "/settings/users", minRole: "admin" },
  { icon: SlidersHorizontal, label: "Custom Fields", href: "/settings/custom-fields", minRole: "admin" },
  { icon: FileSearch, label: "Audit Log", href: "/settings/audit", minRole: "admin" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebarStore();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const canShowItem = (item: NavItem) => {
    if (!item.requiredModule && !item.minRole) return true;

    if (item.minRole && !checkMinimumRole(userRole, item.minRole as Role)) {
      return false;
    }

    if (item.requiredModule) {
      return checkPermission(userRole, item.requiredModule as Module, "read");
    }

    return true;
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(canShowItem),
    }))
    .filter((section) => section.items.length > 0);

  const filteredSettings = settingsItems.filter(canShowItem);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 flex flex-row items-center px-5 border-b">
          <Link
            href="/dashboard"
            className="flex items-center"
            onClick={() => setMobileOpen(false)}
          >
            <Logo width={120} height={30} />
          </Link>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <nav className="px-3 py-3 space-y-6">
            {filteredSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Settings section */}
            {filteredSettings.length > 0 && (
              <div>
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  System
                </p>
                <div className="space-y-0.5">
                  {filteredSettings.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

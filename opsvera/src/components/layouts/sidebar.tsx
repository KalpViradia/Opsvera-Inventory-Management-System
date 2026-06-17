"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronLeft,
  Package,
  Tags,
  Layers,
  Factory,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo, Mark } from "@/components/shared/branding";
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
      { icon: FileSearch, label: "Quotations", href: "/sales/quotations", requiredModule: "sales" },
      { icon: ShoppingCart, label: "Sales Orders", href: "/sales", requiredModule: "sales" },
      { icon: Package, label: "Shipments", href: "/sales/shipments", requiredModule: "sales" },
      { icon: Tags, label: "Price Lists", href: "/sales/price-lists", requiredModule: "sales" },
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
  { icon: UserCheck, label: "Profile", href: "/settings/profile" },
  { icon: Settings, label: "General", href: "/settings/general", requiredModule: "settings" },
  { icon: Shield, label: "Security", href: "/settings/security" },
  { icon: Shield, label: "Users & Roles", href: "/settings/users", minRole: "admin" },
  { icon: SlidersHorizontal, label: "Custom Fields", href: "/settings/custom-fields", minRole: "admin" },
  { icon: FileSearch, label: "Audit Log", href: "/settings/audit", minRole: "admin" },
];

const allNavItems = [...navSections.flatMap(s => s.items), ...settingsItems];

function checkIsActive(pathname: string, itemHref: string) {
  if (pathname === itemHref) return true;
  if (!pathname.startsWith(itemHref + "/")) return false;
  
  // If we match the prefix, ensure there isn't a more specific nav item that matches better
  const moreSpecificMatch = allNavItems.find(other => 
    other.href !== itemHref &&
    other.href.length > itemHref.length &&
    (pathname === other.href || pathname.startsWith(other.href + "/"))
  );
  
  return !moreSpecificMatch;
}

function NavLink({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
      )}
      <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const canShowItem = (item: NavItem) => {
    // If no specific requirement, show it
    if (!item.requiredModule && !item.minRole) return true;

    // Check minimum role if specified
    if (item.minRole && !checkMinimumRole(userRole, item.minRole as Role)) {
      return false;
    }

    // Check module permission if specified
    if (item.requiredModule) {
      return checkPermission(userRole, item.requiredModule as Module, "read");
    }

    return true;
  };

  const filteredSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter(canShowItem),
  })).filter(section => section.items.length > 0);

  const filteredSettings = settingsItems.filter(canShowItem);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r glass h-full transition-all duration-300 ease-in-out relative shrink-0",
          collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
        )}
      >
        {/* Logo */}
        <div className="h-[var(--topbar-height)] flex items-center px-5 border-b shrink-0">
          <Link href="/dashboard" className="flex items-center min-w-0">
            {collapsed ? (
              <Mark width={32} height={32} className="shrink-0 mx-auto" />
            ) : (
              <Logo width={120} height={30} className="shrink-0" />
            )}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-20 bg-card border shadow-sm rounded-full p-1 z-10 hover:bg-muted transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          {mounted && (
            <nav className="px-3 space-y-6">
              {filteredSections.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        collapsed={collapsed}
                        isActive={checkIsActive(pathname, item.href)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          )}
        </ScrollArea>

        {/* Settings Section */}
        {mounted && filteredSettings.length > 0 && (
          <div className="shrink-0 border-t">
            <div className="px-3 py-3">
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  System
                </p>
              )}
              <div className="space-y-0.5">
                {filteredSettings.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    isActive={checkIsActive(pathname, item.href)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

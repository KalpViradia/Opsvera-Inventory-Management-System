"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

/**
 * Route-to-label mapping for breadcrumbs.
 * Extend this as new modules are added.
 */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  inventory: "Inventory",
  purchases: "Purchase Orders",
  suppliers: "Suppliers",
  sales: "Sales Orders",
  customers: "Customers",
  accounting: "Accounting",
  reports: "Reports",
  settings: "Settings",
  general: "General",
  users: "Users",
  roles: "Roles",
  "custom-fields": "Custom Fields",
  audit: "Audit Log",
  new: "Create New",
  onboarding: "Onboarding",
  company: "Company",
  team: "Team",
  preferences: "Preferences",
};

interface BreadcrumbsProps {
  /** Override the auto-generated items with custom ones */
  items?: Array<{ label: string; href?: string }>;
}

/**
 * Auto-generating breadcrumbs from the current URL path.
 * Supports custom items override for special cases.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        return (
          <Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            )}
            {isLast || !item.href ? (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

function generateBreadcrumbs(
  pathname: string
): Array<{ label: string; href?: string }> {
  const segments = pathname.split("/").filter(Boolean);
  const items: Array<{ label: string; href?: string }> = [];

  // Always start with home
  items.push({ label: "Home", href: "/dashboard" });

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip UUID-like segments (but show them as ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const label = isUUID
      ? "Details"
      : ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    items.push({ label, href: currentPath });
  }

  // Last item shouldn't be a link
  if (items.length > 0) {
    items[items.length - 1] = { label: items[items.length - 1].label };
  }

  return items;
}
